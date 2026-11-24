// يغيّر عنوان تبويب المتصفح لكل صفحة (مفيد للمستخدم ولمحركات البحث والمشاركة).
import { useEffect } from "react";

export default function useDocumentTitle(title) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
}
