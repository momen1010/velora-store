import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import fs from "fs";
const env = await initializeTestEnvironment({ projectId: "demo-velora", firestore: { rules: fs.readFileSync(new URL("../firestore.rules", import.meta.url),"utf8"), host:(process.env.FIRESTORE_EMULATOR_HOST||"127.0.0.1:8080").split(":")[0], port:Number((process.env.FIRESTORE_EMULATOR_HOST||"127.0.0.1:8080").split(":")[1]) }});
const item = (o={}) => ({ cartItemId:"1__default", id:"1", name:"Cream", brand:"X", image:"/images/a.jpg", price:540, shade:null, quantity:2, ...o });
const order = (o={}) => { const items=o.items??[item()]; const sub=items.reduce((s,i)=>s+i.price*i.quantity,0); const sh=sub>=799?0:50;
 return { paymentMethod:"cod", status:"pending", customer:{name:"Ahmed Ali",phone:"01012345678",governorate:"القاهرة",city:"Nasr",address:"12 street building 4",notes:""}, items, subtotal:sub, shipping:sh, total:sub+sh, createdAt:serverTimestamp(), ...o }; };
const anon = env.unauthenticatedContext().firestore();
const admin = env.authenticatedContext("adm",{admin:true}).firestore();
const user = env.authenticatedContext("u1").firestore();
const ID="GLW-ABCDEF1234";
let n=0,bad=0; const t=async(name,p)=>{ try{await p;console.log("ok  ",name)}catch(e){bad++;console.log("FAIL",name,e.message.slice(0,150))} };
await t("valid order", assertSucceeds(setDoc(doc(anon,"orders",ID),order())));
await t("valid with shade+ small cart shipping", assertSucceeds(setDoc(doc(anon,"orders","GLW-ABCDEF1235"),order({items:[item({price:100,quantity:1,shade:{name:"Rose",hex:"#D16A7A"},id:3})]}))));
await t("overwrite existing blocked", assertFails(setDoc(doc(anon,"orders",ID),order())));
await t("anon cannot read", assertFails(getDoc(doc(anon,"orders",ID))));
await t("user cannot read", assertFails(getDoc(doc(user,"orders",ID))));
await t("admin can read", assertSucceeds(getDoc(doc(admin,"orders",ID))));
await t("anon cannot update", assertFails(updateDoc(doc(anon,"orders",ID),{status:"delivered"})));
await t("admin status update", assertSucceeds(updateDoc(doc(admin,"orders",ID),{status:"confirmed"})));
await t("admin cannot change total", assertFails(updateDoc(doc(admin,"orders",ID),{total:1})));
await t("nobody deletes", assertFails(deleteDoc(doc(admin,"orders",ID))));
const bads={ "bad id":["orders","evil",order()],
 "bad total":["orders","GLW-AAAAAAAAA1",order({total:1})],
 "bad subtotal":["orders","GLW-AAAAAAAAA2",order({subtotal:1})],
 "bad shipping":["orders","GLW-AAAAAAAAA3",order({items:[item({quantity:1})],shipping:0})],
 "status shipped":["orders","GLW-AAAAAAAAA4",order({status:"shipped"})],
 "extra field":["orders","GLW-AAAAAAAAA5",order({isAdmin:true})],
 "bad phone":["orders","GLW-AAAAAAAAA6",order({customer:{name:"Ahmed Ali",phone:"123",governorate:"القاهرة",city:"Nasr",address:"12 street building 4"}})],
 "bad gov":["orders","GLW-AAAAAAAAA7",order({customer:{name:"Ahmed Ali",phone:"01012345678",governorate:"X",city:"Nasr",address:"12 street building 4"}})],
 "qty 99":["orders","GLW-AAAAAAAAA8",order({items:[item({quantity:99})],subtotal:540*99,total:540*99})],
 "neg price":["orders","GLW-AAAAAAAAA9",order({items:[item({price:-5})],subtotal:-10,total:40})],
 "empty items":["orders","GLW-AAAAAAAAB1",order({items:[],subtotal:0,shipping:50,total:50})],
 "client createdAt":["orders","GLW-AAAAAAAAB2",{...order(),createdAt:new Date("2020-01-01")}],
 "2nd item bad":["orders","GLW-AAAAAAAAB3",order({items:[item(),item({quantity:0,cartItemId:"z"})]})],
 "bad method":["orders","GLW-AAAAAAAAB4",order({paymentMethod:"card"})],
 "other collection":["users","x",{a:1}],
};
for(const [k,[c,i,d]] of Object.entries(bads)) await t("reject "+k, assertFails(setDoc(doc(anon,c,i),d)));
const many=Array.from({length:5},(_,i)=>item({cartItemId:"c"+i,price:10,quantity:1}));
await t("6 lines ok", assertSucceeds(setDoc(doc(anon,"orders","GLW-AAAAAAAAB5"),order({items:many}))));
await t("7 lines rejected", assertFails(setDoc(doc(anon,"orders","GLW-AAAAAAAAB6"),order({items:[...many,item({cartItemId:"q"})]}))));
await env.cleanup(); console.log(bad?`${bad} FAILED`:"ALL PASSED"); process.exit(bad?1:0);
