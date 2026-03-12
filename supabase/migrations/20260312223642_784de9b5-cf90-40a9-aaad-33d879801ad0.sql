INSERT INTO public.policies (slug, title, title_ar, content, content_ar, is_published)
VALUES (
  'payout-policies',
  'Payout Policies',
  'سياسة الصرف',
  '<h2>Payout Policies</h2><p>All payout requests are subject to the following terms and conditions:</p><ul><li>Payouts are processed based on actual logged session hours only.</li><li>Requests must not exceed the available balance at the time of submission.</li><li>Payout requests are reviewed within 3-5 business days.</li><li>If a payout request is found to violate any of our policies, it will be rejected and the amount will be returned to your balance.</li><li>Fraudulent or manipulated session reports may result in account suspension.</li><li>The administration reserves the right to withhold payouts pending investigation.</li></ul>',
  '<h2>سياسة الصرف</h2><p>تخضع جميع طلبات الصرف للشروط والأحكام التالية:</p><ul><li>يتم الصرف بناءً على ساعات الحصص المسجلة فعلياً فقط.</li><li>يجب ألا يتجاوز المبلغ المطلوب الرصيد المتاح وقت تقديم الطلب.</li><li>تتم مراجعة طلبات الصرف خلال 3-5 أيام عمل.</li><li>إذا كان طلب الصرف مخالفاً لأي من سياساتنا، سيتم رفض الطلب وإعادة المبلغ إلى رصيدك.</li><li>قد تؤدي تقارير الحصص الاحتيالية أو المتلاعب بها إلى تعليق الحساب.</li><li>تحتفظ الإدارة بالحق في تعليق المدفوعات في انتظار التحقيق.</li></ul>',
  true
)
ON CONFLICT (slug) DO NOTHING;