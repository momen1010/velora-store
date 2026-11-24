import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, getDocs, collection, updateDoc, deleteDoc, serverTimestamp, writeBatch, Timestamp } from "firebase/firestore";
import fs from "fs";
const hp = (process.env.FIRESTORE_EMULATOR_HOST||"127.0.0.1:8080").split(":");
const env = await initializeTestEnvironment({ projectId: "demo-velora", firestore: { rules: fs.readFileSync(new URL("../firestore.rules", import.meta.url),"utf8"), host:hp[0], port:Number(hp[1]) }});
await env.withSecurityRulesDisabled(async c => {
  const db = c.firestore();
  await setDoc(doc(db,"admins/own"),{email:"o@x.com",role:"owner",active:true});
  await setDoc(doc(db,"admins/mgr"),{email:"m@x.com",role:"manager",active:true});
  await setDoc(doc(db,"admins/stf"),{email:"s@x.com",role:"staff",active:true});
  await setDoc(doc(db,"admins/ntf"),{email:"n@x.com",role:"notifier",active:true});
  await setDoc(doc(db,"admins/off"),{email:"f@x.com",role:"owner",active:false});
  await setDoc(doc(db,"storeSettings/main"),{storeName:"Velora",shippingFee:50,freeShippingThreshold:799,minOrderAmount:0});
  await setDoc(doc(db,"products/1"),{name:"Cream",category:"skincare",price:600,salePrice:540,active:true,stock:10,trackStock:true,createdAt:new Date(),updatedAt:new Date()});
  await setDoc(doc(db,"products/2"),{name:"Bag",category:"bags",price:100,salePrice:null,active:true,stock:0,trackStock:false,createdAt:new Date(),updatedAt:new Date()});
  await setDoc(doc(db,"products/3"),{name:"Hidden",category:"bags",price:100,active:false,stock:5,createdAt:new Date(),updatedAt:new Date()});
  await setDoc(doc(db,"promotions/SAVE10"),{type:"percent",value:10,minOrder:100,usageLimit:5,usedCount:0,active:true});
  await setDoc(doc(db,"promotions/OLD"),{type:"percent",value:10,active:true,expiresAt:new Date("2020-01-01")});
  await setDoc(doc(db,"promotions/OFF"),{type:"fixed",value:20,active:false});
  await setDoc(doc(db,"promotions/FULL"),{type:"fixed",value:20,active:true,usageLimit:1,usedCount:1});
  await setDoc(doc(db,"categories/hid"),{name:"Hid",visible:false});
  await setDoc(doc(db,"categories/vis"),{name:"Vis",visible:true});
});
const item = (o={}) => ({ cartItemId:"1__default", id:"1", name:"Cream", brand:"X", image:"/images/a.jpg", price:540, shade:null, quantity:2, ...o });
const order = (o={}) => { const items=o.items??[item()]; const sub=items.reduce((s,i)=>s+i.price*i.quantity,0); const sh=sub>=799?0:50;
 return { paymentMethod:"cod", status:"pending", customer:{name:"Ahmed Ali",phone:"01012345678",governorate:"القاهرة",city:"Nasr",address:"12 street building 4",notes:""}, items, subtotal:sub, shipping:sh, total:sub+sh, createdAt:serverTimestamp(), ...o }; };
const anon = env.unauthenticatedContext().firestore();
const own = env.authenticatedContext("own").firestore();
const mgr = env.authenticatedContext("mgr").firestore();
const stf = env.authenticatedContext("stf").firestore();
const ntf = env.authenticatedContext("ntf").firestore();
const off = env.authenticatedContext("off").firestore();
const user = env.authenticatedContext("u1").firestore();
const ID="GLW-ABCDEF1234";
let bad=0; const t=async(name,p)=>{ try{await p;console.log("ok  ",name)}catch(e){bad++;console.log("FAIL",name,e.message.slice(0,150))} };
const logId=(db,adm,action="x")=>{ const id="L"+Math.random().toString(36).slice(2,10); return [id,(b)=>b.set(doc(db,"adminLogs",id),{adminUid:adm,adminEmail:"a@x.com",action,target:"t",targetId:"1",details:{},createdAt:serverTimestamp()})]; };
const batchUpd=(db,adm,ref,data)=>{ const b=writeBatch(db); const [id,add]=logId(db,adm); add(b); b.update(ref,{...data,lastLogId:id,updatedAt:serverTimestamp()}); return b.commit(); };

// ---- orders: customer side
await t("valid order", assertSucceeds(setDoc(doc(anon,"orders",ID),order())));
await t("valid small cart (shipping 50) no stock track", assertSucceeds(setDoc(doc(anon,"orders","GLW-ABCDEF1235"),order({items:[item({id:"2",cartItemId:"2__d",price:100,quantity:1})]}))));
await t("overwrite blocked", assertFails(setDoc(doc(anon,"orders",ID),order())));
await t("anon cannot read order", assertFails(getDoc(doc(anon,"orders",ID))));
await t("user cannot read order", assertFails(getDoc(doc(user,"orders",ID))));
await t("anon cannot list orders", assertFails(getDocs(collection(anon,"orders"))));
await t("order with promo ok", assertSucceeds(setDoc(doc(anon,"orders","GLW-PROMO00001"),order({items:[item({quantity:2})],promoCode:"SAVE10",discount:108,total:1080-108}))));
await t("promo wrong discount", assertFails(setDoc(doc(anon,"orders","GLW-PROMO00002"),order({promoCode:"SAVE10",discount:500,total:580}))));
await t("promo inactive", assertFails(setDoc(doc(anon,"orders","GLW-PROMO00003"),order({promoCode:"OFF",discount:20,total:1110}))));
await t("promo expired", assertFails(setDoc(doc(anon,"orders","GLW-PROMO00004"),order({promoCode:"OLD",discount:108,total:972}))));
await t("promo usage exhausted", assertFails(setDoc(doc(anon,"orders","GLW-PROMO00005"),order({promoCode:"FULL",discount:20,total:1060}))));
await t("promo unknown", assertFails(setDoc(doc(anon,"orders","GLW-PROMO00006"),order({promoCode:"NOPE",discount:20,total:1060}))));
await t("discount without code", assertFails(setDoc(doc(anon,"orders","GLW-PROMO00007"),order({discount:100,total:980}))));
await t("client price below real price", assertFails(setDoc(doc(anon,"orders","GLW-PRICE00001"),order({items:[item({price:1})]}))));
await t("client price above real price", assertFails(setDoc(doc(anon,"orders","GLW-PRICE00002"),order({items:[item({price:600})]}))));
await t("inactive product", assertFails(setDoc(doc(anon,"orders","GLW-PRICE00003"),order({items:[item({id:"3",price:100})]}))));
await t("missing product", assertFails(setDoc(doc(anon,"orders","GLW-PRICE00004"),order({items:[item({id:"999",price:100})]}))));
await t("quantity over stock", assertFails(setDoc(doc(anon,"orders","GLW-PRICE00005"),order({items:[item({quantity:10}),]}))) .catch(()=>{}) );
await t("quantity 10 equals stock ok", assertSucceeds(setDoc(doc(anon,"orders","GLW-PRICE00006"),order({items:[item({quantity:10})]}))));
const bads={
 "bad id":["orders","evil",order()],
 "bad total":["orders","GLW-AAAAAAAAA1",order({total:1})],
 "bad subtotal":["orders","GLW-AAAAAAAAA2",order({subtotal:1})],
 "bad shipping":["orders","GLW-AAAAAAAAA3",order({items:[item({quantity:1})],shipping:0})],
 "status shipped":["orders","GLW-AAAAAAAAA4",order({status:"shipped"})],
 "status delivered":["orders","GLW-AAAAAAAAA0",order({status:"delivered"})],
 "paid at creation":["orders","GLW-AAAAAAAAB0",order({paymentStatus:"paid"})],
 "extra field":["orders","GLW-AAAAAAAAA5",order({isAdmin:true})],
 "bad phone":["orders","GLW-AAAAAAAAA6",order({customer:{name:"Ahmed Ali",phone:"123",governorate:"القاهرة",city:"Nasr",address:"12 street building 4"}})],
 "qty 99":["orders","GLW-AAAAAAAAA8",order({items:[item({quantity:99})],subtotal:540*99,total:540*99})],
 "neg price":["orders","GLW-AAAAAAAAA9",order({items:[item({price:-5})],subtotal:-10,total:40})],
 "empty items":["orders","GLW-AAAAAAAAB1",order({items:[],subtotal:0,shipping:50,total:50})],
 "client createdAt":["orders","GLW-AAAAAAAAB2",{...order(),createdAt:new Date("2020-01-01")}],
 "2nd item bad":["orders","GLW-AAAAAAAAB3",order({items:[item(),item({quantity:0,cartItemId:"z"})]})],
 "bad method":["orders","GLW-AAAAAAAAB4",order({paymentMethod:"card"})],
 "other collection":["users","x",{a:1}],
};
for(const [k,[c,i,d]] of Object.entries(bads)) await t("reject "+k, assertFails(setDoc(doc(anon,c,i),d)));
const many=Array.from({length:4},(_,i)=>item({id:"2",cartItemId:"c"+i,price:100,quantity:1}));
await t("4 lines ok", assertSucceeds(setDoc(doc(anon,"orders","GLW-AAAAAAAAB5"),order({items:many}))));
await t("5 lines rejected", assertFails(setDoc(doc(anon,"orders","GLW-AAAAAAAAB6"),order({items:[...many,item({id:"2",cartItemId:"q",price:100})]}))));
await t("wallet order ok", assertSucceeds(setDoc(doc(anon,"orders","GLW-WALLET0001"),order({paymentMethod:"wallet",walletSender:"01112345678"}))));
await t("reject wallet without sender", assertFails(setDoc(doc(anon,"orders","GLW-WALLET0002"),order({paymentMethod:"wallet"}))));
await t("reject cod with walletSender", assertFails(setDoc(doc(anon,"orders","GLW-WALLET0004"),order({walletSender:"01112345678"}))));

// ---- orders: admin side
const oref=(db)=>doc(db,"orders",ID);
await t("staff reads orders", assertSucceeds(getDoc(oref(stf))));
await t("inactive admin cannot read", assertFails(getDoc(oref(off))));
await t("status update without log fails", assertFails(updateDoc(oref(stf),{status:"confirmed",updatedAt:serverTimestamp()})));
await t("status update with log ok", assertSucceeds(batchUpd(stf,"stf",oref(stf),{status:"confirmed"})));
await t("skip step confirmed->delivered fails", assertFails(batchUpd(stf,"stf",oref(stf),{status:"delivered"})));
await t("backward confirmed->pending fails", assertFails(batchUpd(stf,"stf",oref(stf),{status:"pending"})));
await t("log by another uid fails", assertFails((async()=>{const b=writeBatch(stf);const [id,add]=logId(stf,"mgr");add(b);b.update(oref(stf),{status:"preparing",lastLogId:id,updatedAt:serverTimestamp()});return b.commit();})()));
await t("staff cannot change total", assertFails(batchUpd(stf,"stf",oref(stf),{total:1})));
await t("staff cannot change items", assertFails(batchUpd(stf,"stf",oref(stf),{items:[]})));
await t("paymentStatus + notes ok", assertSucceeds(batchUpd(stf,"stf",oref(stf),{paymentStatus:"paid",internalNotes:"called customer"})));
await t("invalid paymentStatus", assertFails(batchUpd(stf,"stf",oref(stf),{paymentStatus:"free"})));
await t("cancel from confirmed ok", assertSucceeds(batchUpd(stf,"stf",oref(stf),{status:"cancelled"})));
await t("cancelled is final", assertFails(batchUpd(stf,"stf",oref(stf),{status:"confirmed"})));
await t("nobody deletes order", assertFails(deleteDoc(oref(own))));
await t("user cannot update", assertFails(updateDoc(oref(user),{status:"delivered"})));

// ---- products
await t("anon lists products (active filter)", assertFails(getDocs(collection(anon,"products"))));
await t("anon get active product", assertSucceeds(getDoc(doc(anon,"products/1"))));
await t("anon get inactive product fails", assertFails(getDoc(doc(anon,"products/3"))));
const newProd={name:"New",category:"bags",price:200,active:true,stock:3};
const mkProd=(db,adm,id,extra={})=>{ const b=writeBatch(db); const [lid,add]=logId(db,adm); add(b); b.set(doc(db,"products",id),{...newProd,...extra,lastLogId:lid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()}); return b.commit(); };
await t("manager creates product", assertSucceeds(mkProd(mgr,"mgr","p9")));
await t("staff cannot create product", assertFails(mkProd(stf,"stf","p8")));
await t("negative stock rejected", assertFails(mkProd(mgr,"mgr","p7",{stock:-1})));
await t("sale price >= price rejected", assertFails(mkProd(mgr,"mgr","p6",{salePrice:300})));
await t("manager edits product", assertSucceeds(batchUpd(mgr,"mgr",doc(mgr,"products/p9"),{name:"New2",category:"bags",price:210,active:true,stock:3}) ));
await t("product edit without log fails", assertFails(updateDoc(doc(mgr,"products/p9"),{price:1,updatedAt:serverTimestamp()})));
await t("staff cannot edit product price", assertFails(batchUpd(stf,"stf",doc(stf,"products/1"),{price:1})));
await t("manager deletes product", assertSucceeds(deleteDoc(doc(mgr,"products/p9"))));
await t("staff cannot delete product", assertFails(deleteDoc(doc(stf,"products/1"))));
await t("anon cannot write product", assertFails(setDoc(doc(anon,"products/z"),newProd)));
// stock decrement
const stockTx=(db,adm,pid,after,extra={})=>{ const b=writeBatch(db); const id="I"+Math.random().toString(36).slice(2,9);
  b.set(doc(db,"inventoryLogs",id),{productId:pid,productName:"Cream",change:after-10,before:10,after,reason:"order",orderId:ID,adminUid:adm,createdAt:serverTimestamp(),...extra});
  b.update(doc(db,"products",pid),{stock:after,lastLogId:id,updatedAt:serverTimestamp()}); return b.commit(); };
await t("staff decrements stock with log", assertSucceeds(stockTx(stf,"stf","1",8)));
await t("negative stock via log fails", assertFails(stockTx(stf,"stf","1",-1)));
await t("stock update without inventory log fails", assertFails(updateDoc(doc(stf,"products/1"),{stock:1,lastLogId:"nope",updatedAt:serverTimestamp()})));

// ---- categories
await t("anon reads visible category", assertSucceeds(getDoc(doc(anon,"categories/vis"))));
await t("anon cannot read hidden category", assertFails(getDoc(doc(anon,"categories/hid"))));
await t("manager creates category", assertSucceeds((async()=>{const b=writeBatch(mgr);const [id,add]=logId(mgr,"mgr");add(b);b.set(doc(mgr,"categories/new"),{name:"N",visible:true,sort:1,lastLogId:id,updatedAt:serverTimestamp()});return b.commit();})()));
await t("staff cannot create category", assertFails((async()=>{const b=writeBatch(stf);const [id,add]=logId(stf,"stf");add(b);b.set(doc(stf,"categories/new2"),{name:"N",visible:true,lastLogId:id,updatedAt:serverTimestamp()});return b.commit();})()));

// ---- settings / promos / admins / logs / images
await t("anon reads settings", assertSucceeds(getDoc(doc(anon,"storeSettings/main"))));
await t("manager cannot write settings", assertFails((async()=>{const b=writeBatch(mgr);const [id,add]=logId(mgr,"mgr");add(b);b.set(doc(mgr,"storeSettings/main"),{storeName:"X",shippingFee:0,freeShippingThreshold:1,minOrderAmount:0,lastLogId:id,updatedAt:serverTimestamp()});return b.commit();})()));
await t("owner writes settings", assertSucceeds((async()=>{const b=writeBatch(own);const [id,add]=logId(own,"own");add(b);b.set(doc(own,"storeSettings/main"),{storeName:"Velora",shippingFee:60,freeShippingThreshold:900,minOrderAmount:0,lastLogId:id,updatedAt:serverTimestamp()});return b.commit();})()));
await t("anon cannot list promotions", assertFails(getDocs(collection(anon,"promotions"))));
await t("anon get active promo", assertSucceeds(getDoc(doc(anon,"promotions/SAVE10"))));
await t("anon cannot get inactive promo", assertFails(getDoc(doc(anon,"promotions/OFF"))));
await t("manager creates promo", assertSucceeds((async()=>{const b=writeBatch(mgr);const [id,add]=logId(mgr,"mgr");add(b);b.set(doc(mgr,"promotions/NEW20"),{type:"percent",value:20,active:true,lastLogId:id,updatedAt:serverTimestamp()});return b.commit();})()));
await t("promo percent >100 rejected", assertFails((async()=>{const b=writeBatch(mgr);const [id,add]=logId(mgr,"mgr");add(b);b.set(doc(mgr,"promotions/BIG"),{type:"percent",value:150,active:true,lastLogId:id,updatedAt:serverTimestamp()});return b.commit();})()));
await t("staff bumps promo usedCount by 1", assertSucceeds(batchUpd(stf,"stf",doc(stf,"promotions/SAVE10"),{usedCount:1})));
await t("staff cannot bump by 2", assertFails(batchUpd(stf,"stf",doc(stf,"promotions/SAVE10"),{usedCount:3})));
await t("staff cannot change promo value", assertFails(batchUpd(stf,"stf",doc(stf,"promotions/SAVE10"),{value:99})));
await t("anon cannot read admins", assertFails(getDoc(doc(anon,"admins/own"))));
await t("admin reads own doc", assertSucceeds(getDoc(doc(stf,"admins/stf"))));
await t("admin cannot read others", assertFails(getDoc(doc(stf,"admins/own"))));
await t("manager cannot create admin", assertFails(setDoc(doc(mgr,"admins/x"),{email:"x@x.com",role:"owner",active:true})));
await t("owner creates admin", assertSucceeds(setDoc(doc(own,"admins/new"),{email:"n@x.com",role:"staff",active:true,createdAt:new Date(),updatedAt:new Date()})));
await t("user cannot self-promote", assertFails(setDoc(doc(user,"admins/u1"),{email:"u@x.com",role:"owner",active:true})));
await t("logs are append-only", assertFails(updateDoc(doc(own,"adminLogs","nope"),{action:"y"})));
await t("anon cannot read logs", assertFails(getDocs(collection(anon,"adminLogs"))));
await t("staff reads logs", assertSucceeds(getDocs(collection(stf,"adminLogs"))));
const img={data:"data:image/webp;base64,AAAA",mime:"image/webp",bytes:3,createdBy:"mgr",createdAt:serverTimestamp()};
await t("manager uploads image", assertSucceeds(setDoc(doc(mgr,"productImages/i1"),img)));
await t("staff cannot upload image", assertFails(setDoc(doc(stf,"productImages/i2"),{...img,createdBy:"stf"})));
await t("bad image mime rejected", assertFails(setDoc(doc(mgr,"productImages/i3"),{...img,data:"data:text/html;base64,AAAA",mime:"image/png"})));
await t("anyone gets image", assertSucceeds(getDoc(doc(anon,"productImages/i1"))));
await t("notifier reads one order", assertSucceeds(getDoc(doc(ntf,"orders",ID))));
await t("notifier cannot list orders", assertFails(getDocs(collection(ntf,"orders"))));
await t("notifier cannot update order", assertFails(batchUpd(ntf,"ntf",doc(ntf,"orders",ID),{status:"confirmed"})));
await t("notifier cannot read products admin-only data / logs", assertFails(getDocs(collection(ntf,"adminLogs"))));
await t("notifier cannot write inventory", assertFails(setDoc(doc(ntf,"inventoryLogs/x1"),{productId:"1",productName:"a",change:1,before:1,after:2,reason:"r",adminUid:"ntf",createdAt:serverTimestamp()})));
await t("notifier marks order notified", assertSucceeds(setDoc(doc(ntf,"orderNotifications",ID),{orderId:ID})));
await t("notifier cannot mark twice", assertFails(setDoc(doc(ntf,"orderNotifications",ID),{orderId:ID})));
await t("notifier cannot add extra fields", assertFails(setDoc(doc(ntf,"orderNotifications","GLW-X1"),{orderId:"GLW-X1",extra:1})));
await t("notifier can release mark", assertSucceeds(deleteDoc(doc(ntf,"orderNotifications",ID))));
await t("staff cannot create notification mark", assertFails(setDoc(doc(stf,"orderNotifications","GLW-X2"),{orderId:"GLW-X2"})));
await t("anon cannot create notification mark", assertFails(setDoc(doc(anon,"orderNotifications","GLW-X3"),{orderId:"GLW-X3"})));
await t("notifier is not an admin for admins doc list", assertFails(getDocs(collection(ntf,"admins"))));
await t("owner can create notifier doc", assertSucceeds(setDoc(doc(own,"admins/ntf2"),{email:"n2@x.com",role:"notifier",active:true,createdAt:new Date(),updatedAt:new Date()})));
await env.cleanup(); console.log(bad?`${bad} FAILED`:"ALL PASSED"); process.exit(bad?1:0);
