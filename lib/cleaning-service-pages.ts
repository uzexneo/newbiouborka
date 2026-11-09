import type { Metadata } from "next";
import { localizePathname, localeToPath, type Locale } from "./i18n/config";
import { buildSocialMetadata, siteUrl } from "./i18n/seo";

export const CLEANING_SERVICE_SLUGS = ["generalnaya", "posle-remonta"] as const;
export type CleaningServiceSlug = (typeof CLEANING_SERVICE_SLUGS)[number];

interface CleaningServicePage {
  serviceId: "cleaning-general" | "cleaning-renovation";
  title: string;
  description: string;
  heading: string;
  shortName: string;
  summary: string;
  priceNote: string;
  scopeHeading: string;
  scope: readonly string[];
  preparation: string;
  faq: readonly { question: string; answer: string }[];
  discount?: string;
}

interface CleaningPageLabels {
  home: string;
  services: string;
  cleaning: string;
  breadcrumb: string;
  price: string;
  askPrice: string;
  quickOrder: string;
  detailedOrder: string;
  call: string;
  experience: string;
  freeVisit: string;
  arrival: string;
  preparationHeading: string;
  processHeading: string;
  process: readonly { title: string; text: string }[];
  faqHeading: string;
  relatedHeading: string;
  allCleaning: string;
  contactHeading: string;
  contactText: string;
}

const labels: Record<Locale, CleaningPageLabels> = {
  ru: {
    home: "Главная",
    services: "Услуги",
    cleaning: "Уборка квартир",
    breadcrumb: "Навигация по разделам",
    price: "Стоимость услуги",
    askPrice: "Уточните стоимость",
    quickOrder: "Заказать уборку",
    detailedOrder: "Заявка с пожеланиями",
    call: "Позвонить",
    experience: "Работаем уже 10 лет",
    freeVisit: "Бесплатный выезд по Ташкенту",
    arrival: "Выезжаем за час после согласования заявки",
    preparationHeading: "Что согласовать перед уборкой",
    processHeading: "Как заказать уборку",
    process: [
      {
        title: "Расскажите об объекте",
        text: "Укажите площадь, нужную услугу и особенности помещения. Можно оставить короткую заявку, а детали обсудить по телефону.",
      },
      {
        title: "Согласуем работы",
        text: "Обсудим состав уборки, итоговую стоимость, доступ к поверхностям и удобное время выезда.",
      },
      {
        title: "Выполним уборку",
        text: "Приезжаем с инвентарём и средствами. После завершения покажем результат и обсудим выполненные работы.",
      },
    ],
    faqHeading: "Вопросы перед заказом",
    relatedHeading: "Другие варианты уборки",
    allCleaning: "Все виды уборки и цены",
    contactHeading: "Обсудим вашу уборку",
    contactText:
      "Оставьте имя и телефон — уточним объём работ и стоимость. Дата, адрес и пожелания в подробной заявке необязательны.",
  },
  uzLatin: {
    home: "Bosh sahifa",
    services: "Xizmatlar",
    cleaning: "Kvartiralarni tozalash",
    breadcrumb: "Bo‘limlar bo‘yicha yo‘l",
    price: "Xizmat narxi",
    askPrice: "Narxni aniqlashtiring",
    quickOrder: "Tozalashni buyurtma qilish",
    detailedOrder: "Istaklar bilan ariza",
    call: "Qo‘ng‘iroq qilish",
    experience: "10 yildan beri ishlaymiz",
    freeVisit: "Toshkent bo‘ylab bepul kelish",
    arrival: "Ariza kelishilgach, bir soat ichida yo‘lga chiqamiz",
    preparationHeading: "Tozalashdan oldin nimalarni kelishish kerak",
    processHeading: "Tozalashni qanday buyurtma qilish mumkin",
    process: [
      {
        title: "Xona haqida ayting",
        text: "Maydonni, kerakli xizmatni va xonaning xususiyatlarini ayting. Qisqa ariza qoldirib, tafsilotlarni telefon orqali muhokama qilish mumkin.",
      },
      {
        title: "Ishlarni kelishamiz",
        text: "Tozalash tarkibi, yakuniy narx, yuzalarga kirish imkoniyati va qulay kelish vaqtini kelishamiz.",
      },
      {
        title: "Tozalashni bajaramiz",
        text: "Anjomlar va tozalash vositalari bilan kelamiz. Ish tugagach, natijani ko‘rsatamiz va bajarilgan ishlarni muhokama qilamiz.",
      },
    ],
    faqHeading: "Buyurtmadan oldingi savollar",
    relatedHeading: "Boshqa tozalash turlari",
    allCleaning: "Barcha tozalash turlari va narxlar",
    contactHeading: "Tozalash ishlarini muhokama qilamiz",
    contactText:
      "Ismingiz va telefon raqamingizni qoldiring — ish hajmi va narxni aniqlashtiramiz. Batafsil arizada sana, manzil va istaklar ixtiyoriy.",
  },
  uzKrill: {
    home: "Бош саҳифа",
    services: "Хизматлар",
    cleaning: "Квартираларни тозалаш",
    breadcrumb: "Бўлимлар бўйича йўл",
    price: "Хизмат нархи",
    askPrice: "Нархни аниқлаштиринг",
    quickOrder: "Тозалашни буюртма қилиш",
    detailedOrder: "Истаклар билан ариза",
    call: "Қўнғироқ қилиш",
    experience: "10 йилдан бери ишлаймиз",
    freeVisit: "Тошкент бўйлаб бепул келиш",
    arrival: "Ариза келишилгач, бир соат ичида йўлга чиқамиз",
    preparationHeading: "Тозалашдан олдин нималарни келишиш керак",
    processHeading: "Тозалашни қандай буюртма қилиш мумкин",
    process: [
      {
        title: "Хона ҳақида айтинг",
        text: "Майдонни, керакли хизматни ва хонанинг хусусиятларини айтинг. Қисқа ариза қолдириб, тафсилотларни телефон орқали муҳокама қилиш мумкин.",
      },
      {
        title: "Ишларни келишамиз",
        text: "Тозалаш таркиби, якуний нарх, юзаларга кириш имконияти ва қулай келиш вақтини келишамиз.",
      },
      {
        title: "Тозалашни бажарамиз",
        text: "Анжомлар ва тозалаш воситалари билан келамиз. Иш тугагач, натижани кўрсатамиз ва бажарилган ишларни муҳокама қиламиз.",
      },
    ],
    faqHeading: "Буюртмадан олдинги саволлар",
    relatedHeading: "Бошқа тозалаш турлари",
    allCleaning: "Барча тозалаш турлари ва нархлар",
    contactHeading: "Тозалаш ишларини муҳокама қиламиз",
    contactText:
      "Исмингиз ва телефон рақамингизни қолдиринг — иш ҳажми ва нархни аниқлаштирамиз. Батафсил аризада сана, манзил ва истаклар ихтиёрий.",
  },
};

const pages: Record<
  Locale,
  Record<CleaningServiceSlug, CleaningServicePage>
> = {
  ru: {
    generalnaya: {
      serviceId: "cleaning-general",
      title: "Генеральная уборка квартир в Ташкенте | Биоуборка",
      description:
        "Генеральная уборка квартиры в Ташкенте: поверхности, мебель, техника, окна и удаление налёта. Бесплатный выезд. Скидка 10% на первый заказ генеральной уборки.",
      heading: "Генеральная уборка квартир в Ташкенте",
      shortName: "Генеральная уборка",
      summary:
        "Для глубокой очистки квартиры: от пыли на карнизах до застарелых загрязнений на поверхностях. Обсудим состояние помещения и согласуем перечень работ перед выездом.",
      priceNote:
        "Состав работ, площадь и степень загрязнения уточняем при заказе. Итоговую стоимость согласуем до начала уборки.",
      scopeHeading: "Что входит в генеральную уборку квартиры",
      scope: [
        "Глубокая очистка поверхностей, мебели и бытовой техники.",
        "Мойка люстр, окон, потолков и стен.",
        "Удаление паутины, протирка карнизов и кондиционеров.",
        "Удаление застарелых загрязнений и известкового налёта.",
      ],
      preparation:
        "При оформлении расскажите о площади и состоянии квартиры, доступе к окнам, мебели и технике. Отдельно обсудим поверхности, требующие бережного ухода, и ваши пожелания. Химчистку мебели и другие дополнительные услуги согласуем отдельно.",
      discount: "Скидка 10% на первый заказ генеральной уборки",
      faq: [
        {
          question: "Чем генеральная уборка отличается от влажной?",
          answer:
            "Влажная уборка включает протирку доступных поверхностей, дверей, ручек, выключателей и зеркал. Генеральная — более глубокую очистку, в том числе застарелых загрязнений и известкового налёта, мойку окон и других согласованных поверхностей.",
        },
        {
          question: "Сколько стоит генеральная уборка?",
          answer:
            "Текущий тариф: {price}. При расчёте уточним площадь, степень загрязнения и перечень работ. Итоговую стоимость согласуем до начала уборки.",
        },
        {
          question: "На какой заказ действует скидка 10%?",
          answer:
            "Скидка 10% действует на первый заказ генеральной уборки. Сообщите при оформлении, что заказываете эту услугу впервые.",
        },
        {
          question: "Входит ли мойка окон?",
          answer:
            "Мойка окон входит в заявленный состав генеральной уборки. При заказе уточним количество и размеры окон, доступ к ним и особенности остекления.",
        },
        {
          question: "Как быстро можно заказать выезд?",
          answer:
            "Выезд по Ташкенту бесплатный. Выезжаем в течение часа после согласования заявки; время прибытия и начала уборки уточняем по телефону.",
        },
      ],
    },
    "posle-remonta": {
      serviceId: "cleaning-renovation",
      title: "Уборка после ремонта в Ташкенте | Биоуборка",
      description:
        "Уборка квартир и домов после ремонта в Ташкенте: строительная пыль, поверхности, полы, окна и зеркала. Уточните состав и стоимость. Бесплатный выезд.",
      heading: "Уборка после ремонта в Ташкенте",
      shortName: "Уборка после ремонта",
      summary:
        "Поможем привести квартиру или дом в порядок после отделочных работ. Удаляем строительную пыль и загрязнения, моем полы, окна и зеркала. Способ очистки и объём работ согласуем с учётом материалов и состояния помещения.",
      priceNote:
        "Стоимость зависит от площади, состояния объекта и согласованного объёма работ. До начала уборки обсудим, какие ремонтные работы уже завершены и что нужно очистить.",
      scopeHeading: "Какие работы согласуем после ремонта",
      scope: [
        "Удаление строительной пыли с доступных поверхностей.",
        "Очистка загрязнений после отделочных работ подходящим для поверхности способом.",
        "Мытьё полов, окон и зеркал.",
        "Протирка поверхностей и проверка согласованного результата после уборки.",
      ],
      preparation:
        "Сообщите, завершены ли пыльные работы, какая площадь помещения и какие материалы использованы в отделке. Заранее обсудим следы клея, краски и других материалов, доступ к окнам, наличие мебели и строительных отходов. Это поможет согласовать состав работ без неверных ожиданий.",
      faq: [
        {
          question: "Чем уборка после ремонта отличается от генеральной?",
          answer:
            "После ремонта основная задача — строительная пыль и загрязнения от отделочных работ. Для их удаления важно учитывать материал поверхности и характер загрязнения. При генеральной уборке в жилом помещении чаще требуется глубокая очистка бытовых загрязнений и налёта.",
        },
        {
          question: "Сколько стоит уборка после ремонта?",
          answer:
            "Текущий тариф: {price}. Точная стоимость зависит от площади, объёма пыли и других загрязнений. Обсудим состояние объекта и согласуем цену до начала уборки.",
        },
        {
          question: "Когда лучше заказывать уборку после ремонта?",
          answer:
            "При оформлении сообщите, закончены ли пыльные отделочные работы. Вместе выберем время уборки, чтобы оставшиеся работы не загрязнили помещение повторно.",
        },
        {
          question: "Можно ли убрать следы клея и краски?",
          answer:
            "Заранее расскажите, какие следы остались и на каких материалах. Способ очистки и возможность удаления конкретных загрязнений нужно согласовать отдельно, чтобы бережно отнестись к новой отделке.",
        },
        {
          question: "Входит ли вывоз строительного мусора?",
          answer:
            "Объём и вид отходов нужно обсудить до заказа. Уборка пыли и поверхностей сама по себе не означает вывоз любого строительного мусора; уточните эту задачу при согласовании работ.",
        },
        {
          question: "Сколько стоит выезд по Ташкенту?",
          answer:
            "Выезд по Ташкенту бесплатный. Выезжаем в течение часа после согласования заявки. Время прибытия и начало уборки уточняем по телефону.",
        },
      ],
    },
  },
  uzLatin: {
    generalnaya: {
      serviceId: "cleaning-general",
      title: "Toshkentda kvartirani general tozalash | Biouborka",
      description:
        "Toshkentda kvartirani general tozalash: yuzalar, mebel, texnika, derazalar va ohak qatlamini tozalash. Bepul kelish. Birinchi general tozalashga 10% chegirma.",
      heading: "Toshkentda kvartirani general tozalash",
      shortName: "General tozalash",
      summary:
        "Kvartirani chuqur tozalash: karnizlardagi changdan yuzalardagi eski iflosliklargacha. Kelishdan oldin xonaning holatini muhokama qilib, ishlar ro‘yxatini kelishamiz.",
      priceNote:
        "Buyurtma berishda ishlar tarkibi, maydon va ifloslanish darajasini aniqlashtiramiz. Yakuniy narx tozalash boshlanishidan oldin kelishiladi.",
      scopeHeading: "Kvartirani general tozalashga nimalar kiradi",
      scope: [
        "Yuzalar, mebel va maishiy texnikani chuqur tozalash.",
        "Qandillar, derazalar, shift va devorlarni yuvish.",
        "O‘rgimchak to‘rlarini olish, karniz va konditsionerlarni artish.",
        "Eski iflosliklar va ohak qatlamini ketkazish.",
      ],
      preparation:
        "Buyurtma berishda kvartira maydoni va holati, derazalar, mebel va texnikaga kirish imkoniyati haqida ayting. Ehtiyotkor parvarish kerak bo‘lgan yuzalar va istaklaringizni alohida muhokama qilamiz. Mebelni kimyoviy tozalash va boshqa qo‘shimcha xizmatlar alohida kelishiladi.",
      discount: "Birinchi general tozalash buyurtmasiga 10% chegirma",
      faq: [
        {
          question: "General tozalash nam tozalashdan qanday farq qiladi?",
          answer:
            "Nam tozalashga ochiq yuzalar, eshiklar, tutqichlar, o‘chirgichlar va oynalarni artish kiradi. General tozalash — eski ifloslik va ohak qatlamini ketkazish, derazalar va boshqa kelishilgan yuzalarni yuvishni o‘z ichiga olgan chuqurroq tozalash.",
        },
        {
          question: "General tozalash qancha turadi?",
          answer:
            "Amaldagi tarif: {price}. Hisoblashda maydon, ifloslanish darajasi va ishlar ro‘yxatini aniqlashtiramiz. Yakuniy narx tozalash boshlanishidan oldin kelishiladi.",
        },
        {
          question: "10% chegirma qaysi buyurtmaga beriladi?",
          answer:
            "10% chegirma birinchi general tozalash buyurtmasiga beriladi. Ariza berayotganda bu xizmatni birinchi marta buyurtma qilayotganingizni ayting.",
        },
        {
          question: "Derazalarni yuvish kiradimi?",
          answer:
            "Derazalarni yuvish general tozalash tarkibiga kiradi. Buyurtma berishda derazalar soni va o‘lchami, ularga kirish imkoniyati hamda oynalash xususiyatlarini aniqlashtiramiz.",
        },
        {
          question: "Qanchalik tez kelishni buyurtma qilish mumkin?",
          answer:
            "Toshkent bo‘ylab kelish bepul. Ariza kelishilgach, bir soat ichida yo‘lga chiqamiz; yetib kelish va ish boshlash vaqtini telefon orqali aniqlashtiramiz.",
        },
      ],
    },
    "posle-remonta": {
      serviceId: "cleaning-renovation",
      title: "Toshkentda ta’mirdan keyin tozalash | Biouborka",
      description:
        "Toshkentda kvartira va uylarni ta’mirdan keyin tozalash: qurilish changi, yuzalar, pollar, deraza va oynalar. Ishlar tarkibi va narxini aniqlashtiring. Bepul kelish.",
      heading: "Toshkentda ta’mirdan keyin tozalash",
      shortName: "Ta’mirdan keyin tozalash",
      summary:
        "Pardozlash ishlaridan keyin kvartira yoki uyni tartibga keltirishga yordam beramiz. Qurilish changi va iflosliklarni ketkazamiz, pol, deraza va oynalarni yuvamiz. Tozalash usuli va ish hajmini materiallar hamda xona holatini hisobga olib kelishamiz.",
      priceNote:
        "Narx maydon, obyekt holati va kelishilgan ish hajmiga bog‘liq. Tozalashdan oldin qaysi ta’mirlash ishlari tugagani va nimalarni tozalash kerakligini muhokama qilamiz.",
      scopeHeading: "Ta’mirdan keyin qaysi ishlarni kelishamiz",
      scope: [
        "Kirish mumkin bo‘lgan yuzalardan qurilish changini ketkazish.",
        "Pardozlashdan qolgan iflosliklarni yuzaga mos usulda tozalash.",
        "Pol, deraza va oynalarni yuvish.",
        "Yuzalarni artish va tozalashdan keyin kelishilgan natijani tekshirish.",
      ],
      preparation:
        "Chang chiqaradigan ishlar tugaganmi, xona maydoni qancha va pardozlashda qanday materiallar ishlatilganini ayting. Yelim, bo‘yoq va boshqa materiallar izlari, derazalarga kirish, mebel va qurilish chiqindilari borligini oldindan muhokama qilamiz. Bu ishlar tarkibini to‘g‘ri kelishishga yordam beradi.",
      faq: [
        {
          question:
            "Ta’mirdan keyingi tozalash general tozalashdan nimasi bilan farq qiladi?",
          answer:
            "Ta’mirdan keyin asosiy vazifa — qurilish changi va pardozlashdan qolgan iflosliklar. Ularni ketkazishda yuza materiali va ifloslik turini hisobga olish muhim. Yashab turilgan xonadondagi general tozalashda esa ko‘proq maishiy ifloslik va ohak qatlamini chuqur tozalash talab etiladi.",
        },
        {
          question: "Ta’mirdan keyin tozalash qancha turadi?",
          answer:
            "Amaldagi tarif: {price}. Aniq narx maydon, chang miqdori va boshqa iflosliklarga bog‘liq. Obyekt holatini muhokama qilib, ish boshlanishidan oldin narxni kelishamiz.",
        },
        {
          question:
            "Ta’mirdan keyingi tozalashni qachon buyurtma qilgan ma’qul?",
          answer:
            "Ariza berishda chang chiqaradigan pardozlash ishlari tugagan-tugamaganini ayting. Qolgan ishlar xonani qayta ifloslantirmasligi uchun tozalash vaqtini birga tanlaymiz.",
        },
        {
          question: "Yelim va bo‘yoq izlarini ketkazish mumkinmi?",
          answer:
            "Qanday izlar qaysi materiallarda qolganini oldindan ayting. Yangi pardozga ehtiyotkor munosabatda bo‘lish uchun tozalash usuli va muayyan ifloslikni ketkazish imkoniyati alohida kelishilishi kerak.",
        },
        {
          question: "Qurilish chiqindilarini olib ketish kiradimi?",
          answer:
            "Chiqindilar turi va hajmini buyurtmadan oldin muhokama qilish kerak. Chang va yuzalarni tozalash har qanday qurilish chiqindisini olib ketishni anglatmaydi; bu vazifani ishlar kelishilganda aniqlashtiring.",
        },
        {
          question: "Toshkent bo‘ylab kelish qancha turadi?",
          answer:
            "Toshkent bo‘ylab kelish bepul. Ariza kelishilgach, bir soat ichida yo‘lga chiqamiz. Yetib kelish va ish boshlash vaqtini telefon orqali aniqlashtiramiz.",
        },
      ],
    },
  },
  uzKrill: {
    generalnaya: {
      serviceId: "cleaning-general",
      title: "Тошкентда квартирани генерал тозалаш | Biouborka",
      description:
        "Тошкентда квартирани генерал тозалаш: юзалар, мебель, техника, деразалар ва оҳак қатламини тозалаш. Бепул келиш. Биринчи генерал тозалашга 10% чегирма.",
      heading: "Тошкентда квартирани генерал тозалаш",
      shortName: "Генерал тозалаш",
      summary:
        "Квартирани чуқур тозалаш: карнизлардаги чангдан юзалардаги эски ифлосликларгача. Келишдан олдин хонанинг ҳолатини муҳокама қилиб, ишлар рўйхатини келишамиз.",
      priceNote:
        "Буюртма беришда ишлар таркиби, майдон ва ифлосланиш даражасини аниқлаштирамиз. Якуний нарх тозалаш бошланишидан олдин келишилади.",
      scopeHeading: "Квартирани генерал тозалашга нималар киради",
      scope: [
        "Юзалар, мебель ва маиший техникани чуқур тозалаш.",
        "Қандиллар, деразалар, шифт ва деворларни ювиш.",
        "Ўргимчак тўрларини олиш, карниз ва кондиционерларни артиш.",
        "Эски ифлосликлар ва оҳак қатламини кетказиш.",
      ],
      preparation:
        "Буюртма беришда квартира майдони ва ҳолати, деразалар, мебель ва техникага кириш имконияти ҳақида айтинг. Эҳтиёткор парвариш керак бўлган юзалар ва истакларингизни алоҳида муҳокама қиламиз. Мебелни кимёвий тозалаш ва бошқа қўшимча хизматлар алоҳида келишилади.",
      discount: "Биринчи генерал тозалаш буюртмасига 10% чегирма",
      faq: [
        {
          question: "Генерал тозалаш нам тозалашдан қандай фарқ қилади?",
          answer:
            "Нам тозалашга очиқ юзалар, эшиклар, тутқичлар, ўчиргичлар ва ойналарни артиш киради. Генерал тозалаш — эски ифлослик ва оҳак қатламини кетказиш, деразалар ва бошқа келишилган юзаларни ювишни ўз ичига олган чуқурроқ тозалаш.",
        },
        {
          question: "Генерал тозалаш қанча туради?",
          answer:
            "Амалдаги тариф: {price}. Ҳисоблашда майдон, ифлосланиш даражаси ва ишлар рўйхатини аниқлаштирамиз. Якуний нарх тозалаш бошланишидан олдин келишилади.",
        },
        {
          question: "10% чегирма қайси буюртмага берилади?",
          answer:
            "10% чегирма биринчи генерал тозалаш буюртмасига берилади. Ариза бераётганда бу хизматни биринчи марта буюртма қилаётганингизни айтинг.",
        },
        {
          question: "Деразаларни ювиш кирадими?",
          answer:
            "Деразаларни ювиш генерал тозалаш таркибига киради. Буюртма беришда деразалар сони ва ўлчами, уларга кириш имконияти ҳамда ойналаш хусусиятларини аниқлаштирамиз.",
        },
        {
          question: "Қанчалик тез келишни буюртма қилиш мумкин?",
          answer:
            "Тошкент бўйлаб келиш бепул. Ариза келишилгач, бир соат ичида йўлга чиқамиз; етиб келиш ва иш бошлаш вақтини телефон орқали аниқлаштирамиз.",
        },
      ],
    },
    "posle-remonta": {
      serviceId: "cleaning-renovation",
      title: "Тошкентда таъмирдан кейин тозалаш | Biouborka",
      description:
        "Тошкентда квартира ва уйларни таъмирдан кейин тозалаш: қурилиш чанги, юзалар, поллар, дераза ва ойналар. Ишлар таркиби ва нархини аниқлаштиринг. Бепул келиш.",
      heading: "Тошкентда таъмирдан кейин тозалаш",
      shortName: "Таъмирдан кейин тозалаш",
      summary:
        "Пардозлаш ишларидан кейин квартира ёки уйни тартибга келтиришга ёрдам берамиз. Қурилиш чанги ва ифлосликларни кетказамиз, пол, дераза ва ойналарни ювамиз. Тозалаш усули ва иш ҳажмини материаллар ҳамда хона ҳолатини ҳисобга олиб келишамиз.",
      priceNote:
        "Нарх майдон, объект ҳолати ва келишилган иш ҳажмига боғлиқ. Тозалашдан олдин қайси таъмирлаш ишлари тугагани ва нималарни тозалаш кераклигини муҳокама қиламиз.",
      scopeHeading: "Таъмирдан кейин қайси ишларни келишамиз",
      scope: [
        "Кириш мумкин бўлган юзалардан қурилиш чангини кетказиш.",
        "Пардозлашдан қолган ифлосликларни юзага мос усулда тозалаш.",
        "Пол, дераза ва ойналарни ювиш.",
        "Юзаларни артиш ва тозалашдан кейин келишилган натижани текшириш.",
      ],
      preparation:
        "Чанг чиқарадиган ишлар тугаганми, хона майдони қанча ва пардозлашда қандай материаллар ишлатилганини айтинг. Елим, бўёқ ва бошқа материаллар излари, деразаларга кириш, мебель ва қурилиш чиқиндилари борлигини олдиндан муҳокама қиламиз. Бу ишлар таркибини тўғри келишишга ёрдам беради.",
      faq: [
        {
          question:
            "Таъмирдан кейинги тозалаш генерал тозалашдан нимаси билан фарқ қилади?",
          answer:
            "Таъмирдан кейин асосий вазифа — қурилиш чанги ва пардозлашдан қолган ифлосликлар. Уларни кетказишда юза материали ва ифлослик турини ҳисобга олиш муҳим. Яшаб турилган хонадондаги генерал тозалашда эса кўпроқ маиший ифлослик ва оҳак қатламини чуқур тозалаш талаб этилади.",
        },
        {
          question: "Таъмирдан кейин тозалаш қанча туради?",
          answer:
            "Амалдаги тариф: {price}. Аниқ нарх майдон, чанг миқдори ва бошқа ифлосликларга боғлиқ. Объект ҳолатини муҳокама қилиб, иш бошланишидан олдин нархни келишамиз.",
        },
        {
          question: "Таъмирдан кейинги тозалашни қачон буюртма қилган маъқул?",
          answer:
            "Ариза беришда чанг чиқарадиган пардозлаш ишлари тугаган-тугамаганини айтинг. Қолган ишлар хонани қайта ифлослантирмаслиги учун тозалаш вақтини бирга танлаймиз.",
        },
        {
          question: "Елим ва бўёқ изларини кетказиш мумкинми?",
          answer:
            "Қандай излар қайси материалларда қолганини олдиндан айтинг. Янги пардозга эҳтиёткор муносабатда бўлиш учун тозалаш усули ва муайян ифлосликни кетказиш имконияти алоҳида келишилиши керак.",
        },
        {
          question: "Қурилиш чиқиндиларини олиб кетиш кирадими?",
          answer:
            "Чиқиндилар тури ва ҳажмини буюртмадан олдин муҳокама қилиш керак. Чанг ва юзаларни тозалаш ҳар қандай қурилиш чиқиндисини олиб кетишни англатмайди; бу вазифани ишлар келишилганда аниқлаштиринг.",
        },
        {
          question: "Тошкент бўйлаб келиш қанча туради?",
          answer:
            "Тошкент бўйлаб келиш бепул. Ариза келишилгач, бир соат ичида йўлга чиқамиз. Етиб келиш ва иш бошлаш вақтини телефон орқали аниқлаштирамиз.",
        },
      ],
    },
  },
};

export function isCleaningServiceSlug(
  value: string
): value is CleaningServiceSlug {
  return CLEANING_SERVICE_SLUGS.some((slug) => slug === value);
}

export function cleaningServicePath(
  slug: CleaningServiceSlug,
  locale: Locale
): string {
  return localizePathname(`/uslugi/uborka/${slug}`, locale);
}

export function getCleaningServicePage(
  slug: CleaningServiceSlug,
  locale: Locale
): CleaningServicePage {
  return pages[locale][slug];
}

export function getCleaningPageLabels(locale: Locale): CleaningPageLabels {
  return labels[locale];
}

export function formatCleaningServiceText(text: string, price: string): string {
  return text.replaceAll("{price}", price);
}

export function buildCleaningServiceMetadata(
  slug: CleaningServiceSlug,
  locale: Locale
): Metadata {
  const page = getCleaningServicePage(slug, locale);
  const url = `${siteUrl}${cleaningServicePath(slug, locale)}`;
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: {
      canonical: url,
      languages: {
        ru: `${siteUrl}${cleaningServicePath(slug, "ru")}`,
        "uz-Latn": `${siteUrl}${cleaningServicePath(slug, "uzLatin")}`,
        "uz-Cyrl": `${siteUrl}${cleaningServicePath(slug, "uzKrill")}`,
        "x-default": `${siteUrl}${cleaningServicePath(slug, "ru")}`,
      },
    },
    ...buildSocialMetadata(page.title, page.description, url, locale),
  };
}

export function getCleaningServiceJsonLd(
  slug: CleaningServiceSlug,
  locale: Locale
) {
  const page = getCleaningServicePage(slug, locale);
  const text = getCleaningPageLabels(locale);
  const url = `${siteUrl}${cleaningServicePath(slug, locale)}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: page.heading,
        description: page.summary,
        url,
        areaServed: {
          "@type": "City",
          name:
            locale === "ru"
              ? "Ташкент"
              : locale === "uzLatin"
                ? "Toshkent"
                : "Тошкент",
        },
        provider: {
          "@type": "Organization",
          "@id": `${siteUrl}/#organization`,
          name: "BIOUBORKA.UZ",
          url: siteUrl,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: text.home,
            item: `${siteUrl}${localeToPath[locale]}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: text.services,
            item: `${siteUrl}${localizePathname("/uslugi", locale)}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: text.cleaning,
            item: `${siteUrl}${localizePathname("/uslugi/uborka", locale)}`,
          },
          { "@type": "ListItem", position: 4, name: page.shortName, item: url },
        ],
      },
    ],
  };
}
