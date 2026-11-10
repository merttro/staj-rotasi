# Doğrulama kayıtları

## Otomatik kontroller

- `npm test`: veri modeli için 6 test başarılı. Geçerli/boş alan, proje silme ilişkileri, bozuk referanslar, yinelenen kimlikler, alan sınırları, takvim tarihleri ve Türkçe arama kapsanır.
- `npm run typecheck`: TypeScript denetimi başarılı.
- `npm run build`: üretim derlemesi başarılı.

## Tarayıcıda yürütülen kontroller

- Yeni proje ve görev oluşturuldu.
- Görev adıyla arama yapıldı ve doğru kart bulundu.
- Görev durumu Tamamlandı olarak değiştirildi.
- Sayfa yenilendi; proje, görev ve tamamlanma durumu korundu.
- Not oluşturuldu, Türkçe karakterler ve satır sonlarıyla kaydedildi ve arandı.
- JSON yedeği indirildi; dosya seçici ile yüklendi; uygulama onay ekranı gösterdi ve yedek uygulandı.
- 390 piksel genişlikte düzen ve DOM genişliği kontrol edildi; yatay sayfa taşması görülmedi.
- Mobil görünümde veri yönetimine erişim için üst araç düğmesi eklendi.

Bunlar belirli kontrollerin sonuçlarıdır. Tüm tarayıcıların, bütün erişilebilirlik ölçütlerinin veya tüm olası hata durumlarının kapsamlı doğrulaması yapıldığı anlamına gelmez. Eş zamanlı sekmelerde çakışma çözümü yoktur.
