# Yapay zeka destekli geliştirme süreci

**Araç:** OpenAI Codex  
**Çalışmanın sahibi:** Mert Ali Korkmaz  
**Staj kurumu:** Software Persona

## Plan

Yönergeye uygun, dış servis anahtarı gerektirmeyen bir proje takip uygulaması seçildi. Ekranlar genel bakış, projeler, görev panosu ve çalışma notları olarak belirlendi. Kullanıcı projelerine görev bağlayacak, durum değiştirecek ve not tutacaktı. Hesap sistemi yerine tarayıcıda yerel kayıt tercih edildi.

Veri modeli proje, görev, not ve sürümlü çalışma alanından oluşur. Yapay zeka desteğiyle form sınırları, proje silmede bağlı kayıtların durumu, ilerleme yüzdesi, tarih karşılaştırması ve yedek yükleme şeması planlandı.

## Yapay zekanın kullanıldığı aşamalar

- Fikir ve kapsam: yönerge maddelerinin çalışan özelliklere dönüştürülmesi.
- Bileşenler: ekranlar, proje/görev kartları, formlar ve dialog pencereleri.
- Stil: açık zemin, yeşil vurgu, responsive düzen ve odak stilleri.
- Hata ayıklama: TypeScript denetimi, tarayıcı etkileşimleri, mobil veri yönetimi erişimi.
- Test: bozuk yedek, tarih sınırı, silme ilişkileri ve kayıt akışları.
- Dokümantasyon: kurulum, kullanım, veri modeli, teslim eşleştirmesi ve sınırlamalar.

Uygulama kodu büyük ölçüde Codex tarafından oluşturuldu. Bu dosya, çalışmanın yapay zeka desteğini açıkça belirtir. Uygulamada çalışma zamanında AI API çağrısı bulunmaz.

## Yeniden kullanılabilir örnek istemler

Aşağıdakiler geliştirme kararlarını anlatmak için hazırlanmış örnek istemlerdir; konuşmanın birebir alıntıları değildir.

> React ile proje, görev ve not ekranları olan, TypeScript veri modeline sahip bir staj takip uygulaması planla. Veriler LocalStorage'da tutulsun.

> Proje silindiğinde ona bağlı görev ve notları kaldır. Silme öncesinde kaç kaydın etkileneceğini göster.

> JSON yedeği yüklerken sürümü, alan uzunluklarını, tarihleri, benzersiz kimlikleri ve proje ilişkilerini kontrol et. Geçersiz dosya mevcut veriyi ezmesin.

> Arayüzü 390 piksel genişliğinde kontrol et. Mobil görünümde yedekleme ve hakkında ekranlarına erişim kaybolmasın.

> İlerleme hesabını, boş projeyi, Türkçe aramayı ve geçersiz yedekleri Node test runner ile sınayan testler yaz.

## Üretilen kodun değerlendirilmesi

Kodun çalıştığı yalnızca görsel tasarımla varsayılmadı. Veri kuralları otomatik testlerle, React akışı tarayıcıda gerçek formlarla, tipler TypeScript ile, yayın çıktısı üretim derlemesiyle kontrol edildi. Gerçekten çalıştırılan kontroller TESTLER.md dosyasında listelenir. AI çıktısının kısıtları ve ürünün eksik özellikleri README'de açıklanır.
