// js/result.js — 學院結果頁渲染（由 result.html 載入）

const ACADEMY_ORDER = window.ACADEMY_THEME?.ORDER || [
  "red",
  "green",
  "blue",
  "black",
  "white",
];

let globalCountsCache = null;
let globalTotalCache = 0;
let revealTimers = [];

// Three-act reveal is presentation-only. Scoring/result data is computed before this.
const REVEAL_ACT2_DELAY_MS = 520;
const REVEAL_ACT3_DELAY_MS = 1200;

// 所有學院的段落內容（純中文，hybrid key 為對象學院 id）
const ACADEMY_CONTENT = {
  red: {
    main: [
      "你的作品市場價值和IP效應意味著你不僅關注作品本身的內容和風格，還考慮到它們的商業價值和長期影響。",
      "你對市場趨勢有敏銳的洞察力，能夠預測未來的趨勢和受歡迎的主題，因此在選擇創作題材時非常有把握。",
      "你善於瞄準讀者的喜好和需求，透過市場調研和分析，深入了解他們對於故事情節、人物形象、風格氛圍等方面的偏好，以此為基礎挑選題材，確保作品符合市場需求。",
      "這樣的創作方式不僅能夠提高作品的市場價值和競爭力，更能夠讓出版商和讀者對你產生信任和依賴，成為他們心目中的優秀作者。",
      "你的作品同時也能夠在多個媒體平台上發揮良好的效果，例如電影、電視劇、遊戲、動漫等，因此也很受到出版商和製作公司的青睞。",
      "更進階的紅馳學生還擅長經營自己的讀者群，亦不排斥業務性質的人際交流，建立自己的品牌形象，擴大自己的影響力和粉絲基礎。",
      "你懂得利用各種社交媒體和網絡平台與讀者及其他作者互動，積極地舉辦、參加各種文學活動和講座，提高自己的曝光率和知名度。",
      "這樣的經營方式不僅有助於增加讀者對你的認識和了解，還能夠為你帶來更多的商業機會和合作伙伴，這也是紅馳學院最容易誕生出名作者的原因。",
    ],
    pureView: [
      "紅馳學院的人相對其他學院自律性較高，因為你們心中有一套自己的經營法則，需要寫文、PO社群、交流、辦活動、多媒體形式嘗試等等，為了付諸實行，你們通常會成為時間管理大師。",
      "在搶奪注意力大戰的時代裡，是紅馳人的天下。",
      "為了不被讀者遺忘，紅馳人也通常是高產作者，雖然別人看你們以為你們是碼字機，但那都是你們用爆肝換來的。請紅馳人務必注意身體健康。",
      "紅馳人通常心胸開闊，你們不像其他學院的人，有某種偏執。你們喜歡吸收各種類型的作品，分析他們的吸引度，吸收成為自己的養分。",
      "對於銀倚學院，紅馳學院可能會認為銀倚學院的作品適合大眾娛樂市場，而且非常善於描繪浪漫愛情和人物關係，能夠引起讀者的共鳴和情感投入。",
      "對於藍行學院，紅馳人可能會欣賞他們對於故事世界和角色設計的考究和真實感。不過，紅馳人也會提出藍行作品可能缺乏對於讀者的娛樂性吸引力和廣泛性，在商業市場上的表現相對較弱。",
      "對於綠躍學院，紅馳人通常會認為綠躍作品較為輕鬆和有趣，注重幽默和創意。對紅馳來說與綠躍有部分相似之處，但綠躍人在創作上相較任性，也有過於跳痛或完整性不足的狀況發生。",
      "對於墨佇學院，紅馳人可能會欣賞墨佇學院的作品注重文筆和深度探討，但也許會認為他們缺乏商業元素，不夠吸引大眾。有些紅馳作品也會觸碰社會議題，並將議題處理的簡單易懂又更有張力，以吸引更多人關注。",
      "基於自身長期觀察群眾喜好的敏銳度，紅馳人也擅長撰寫大眾感興趣的題材，展開高張力的劇情，讓讀者即使一時之間無法說出這作品獨特之處，卻也難以放下作品，只覺得很好看。",
      "然而紅馳人也容易受到誤解，一些交流、互相關注、互衝流量，甚至一些更積極地自薦行為會旁人被嘲笑，但對你們來說，現在已經不是寫得好就有人關注的時代，自許清流或許是一種浪漫，但下場往往是被洪流淹沒。",
      "而你們就只是比較務實而已。",
    ],
    hybrids: {
      green: [
        "不僅具有商業敏感度和對市場趨勢的了解，還能夠掌握市場的需求和變化，以創作出符合市場和受眾需要的作品。",
        "同時創作風格和思維也非常獨特和開創性，能夠為讀者帶來耳目一新的閱讀體驗。",
        "你可能會嘗試探索新興的創作方式和媒體形式，如電子遊戲、動畫、漫畫等，將創意元素與新媒體相結合，開創新的市場和受眾。",
        "這種結合創意思維和商業能力的特質，讓具有綠躍特質的紅馳學生在創作的領域中具有競爭力和廣泛的市場價值。",
      ],
      blue: [
        "你善於觀察市場趨勢和消費者需求，能夠從中找到商業機會並加以利用。",
        "同時，也具有藍行的邏輯思維，注重細節、寫作時精益求精，並且能夠通過合理的推理和脈絡，將故事和情節合理化。",
        "寫作風格講究細節，注重劇情的合理性和邏輯性，並且能夠將商業元素巧妙地融入故事中。",
        "具有藍行特質的紅馳學生擅長從商業角度出發思考寫作，能夠從市場需求中挖掘創作靈感，將作品打造成商業上的成功之作。",
      ],
      black: [
        "不僅懂得市場調研和分析，能夠從市場和觀眾的角度出發，寫出容易被大眾接受的作品。可以很好地掌握作品的節奏、懸念和高潮，使故事更具有吸引力和感染力。",
        "同時能夠通過精湛的文筆和詩意的表達來打動讀者和觀眾。擅長運用象徵和隱喻等文學技巧，表現主題和情感，使作品更具有深度和內涵。",
        "你能夠從市場和觀眾的需求出發，創作出容易被接受的作品，同時又不失文學性和深度。作品能夠打動人心，並且有可能被轉化為其他媒體形式。",
      ],
      white: [
        "你將市場調研和分析作為創作的一個重要步驟，從觀眾的喜好和需求出發，創作出容易被市場接受和喜愛的作品。",
        "同時，你也注重角色的心理描寫和互動，善於利用角色的情感和心理狀態來推進劇情的發展，打造角色魅力。你很清楚怎麼塑造大家都喜愛的角色。",
        "這樣的學生能夠創作出引人入勝的故事情節，同時在角色塑造上有深入的思考和挖掘。",
        "具有強大銀倚特質的紅馳學生是最受市場歡迎的，你們的作品往往黏性很高，令讀者沉迷其中。",
      ],
    },
  },

  green: {
    main: [
      "綠躍學生最注重作品的創意和新奇感，喜歡挑戰常理，以獨特和怪奇的特質吸引讀者的注意力。創意是你最大的武器。",
      "綠躍學生非常注重作品的獨特性，對老套並不感興趣，安排要出奇不意，認為創意才是作品最大的魅力。",
      "因此綠躍的學生有著強烈的獨立思考能力，不會隨波逐流，而是會有自己的看法和想法，並且勇於表達和實現。",
      "在創作時，你經常嘗試不同的設定、情節和人物，開創新的領域和風格，不斷尋找新的創作可能性，希望讓作品更加獨特、有趣、引人入勝。",
      "就好像身旁有個挖坑獸，不斷慫恿你玩耍，但注意不要成為渣作者，一時興起就開坑，熱情退去就棄坑。",
      "你不斷地學習和嘗試新的技巧和風格，不斷地挑戰自己，讓自己的作品更加特別，想讓自己的作品成為沒有取代性的存在，就算它看起來很瘋狂。",
      "綠躍的學生有著豐富的想象力和創意，能夠想出奇特而又新穎的點子，有時會被認為天馬行空、思考跳躍。",
      "因此要注意一些曲高和寡的創意需要靠更多鋪層，才能引導讀者進入作品的世界。",
    ],
    pureView: [
      "綠躍學院的人喜歡有趣的東西，通常對套路老梗、不屑一顧，因此寫作上通常比較任性，如果想出的點子不夠好玩，那怎樣也寫不下去。",
      "因此坑開著開著就棄了也是常有的事，然後再開一個新坑。不知不覺就坑坑相連到天邊，被讀者列入渣作者黑名單。",
      "綠躍人最重視作品中的有趣元素，以有趣與吸引的敏銳度來說，除了同院人的作品外，你們比較容易喜歡銀倚和紅馳人的作品。但綠躍學生與紅馳學院的學生也容易產生分歧，因為對你們來說商業考量雖然也很重要，但太過常見的題材提不起勁就是提不起勁。",
      "不過你們也不是不重視市場，會努力為自己想辦法，找到既新奇又有市場的方向，努力開創自己的一片天。",
      "你可能也會喜歡藍行人的作品，如果藍行人為了合理化自己的創意，做了酷炫又複雜的世界觀設定，處理得很有一回事，也很容易讓你感興趣。不過如果藍行的作品只有複雜，缺乏有趣的話，那就興致缺缺了。",
      "同樣的，你看墨佇的作品也是如此，你們欣賞墨佇學院對於議題的探討和深度。對綠躍人來說，單純講述一個有趣的故事沒什麼不好。或是議題應該包裝得有趣才更容易被關注。",
      "創新與嘗試有時為了樂趣性而淡化其邏輯，因此有時你對講究邏輯的藍行人又愛又恨，感覺對方簡直是吐槽魔王，但你會感謝有這種考究魔人的存在，幫你找到漏洞。",
      "綠躍人認為銀倚作品通常注重情感和人物的複雜內心描寫，透過豐富的情感交織和人物關係來打動讀者。",
      "另外，銀倚學院的作品通常會有著浪漫主義色彩和一定的文學性，寫作風格也較為流暢和詩意化，這部分和墨佇很像。不過，綠躍人也認為銀倚學院的作品注重於人物情感，新奇設定相對較少，而感到可惜。",
      "雖然說得好像綠躍人很挑剔，但只要作品有新意和有趣，綠躍人對其他學院的風格都抱持著開放的態度，對你們來說更多元不同的創作風格，才能讓市面上的作品多元有趣。",
    ],
    hybrids: {
      red: [
        "不僅創作風格和思維非常獨特和開創性，能夠為讀者帶來耳目一新的閱讀體驗。",
        "同時也具有商業敏感度和對市場趨勢的了解，能夠掌握市場的需求和變化，以創作出符合市場和受眾需要的作品。",
        "你可能會嘗試探索新興的創作方式和媒體形式，如電子遊戲、動畫、漫畫等，將創意元素與新媒體相結合，開創新的市場和受眾。",
        "這種結合創意思維和商業能力的特質，讓具有紅馳特質的綠躍學生在創作的領域中具有競爭力和廣泛的市場價值。",
      ],
      blue: [
        "你能夠善用創意，將這些分類、整合和結構化的元素妥善地組合在一起，創造出獨特、新穎和引人入勝的作品。",
        "同時也擅長將複雜的資訊進行分類、整合和結構化，以確保作品內在的邏輯性和連貫性。",
        "喜歡挑戰常規，創造出奇特而有趣的設定和情節，同時也注重邏輯性和合理性，因此會花費大量心力將這些奇特的設定系統化，使其看起來有條有理，煞有其事，讓讀者不會感到設定脫離現實或過於離奇。",
        "具有藍行特質的綠躍學生既注重作品的創意和新奇感，又重視作品的邏輯性和合理性，能夠將獨特而奇特的設定和情節系統化，創造出具有深度和意義的作品，同時吸引讀者的注意力。",
      ],
      black: [
        "你具有獨特的創意和想象力，能夠打破傳統的文學模式，創作出新穎的故事情節和角色形象，使作品更加生動有趣。",
        "同時在文學方面也非常有天賦，擅長運用精湛的文筆和詩意的表達方式，透過獨特的風格和手法來描繪出作品中的情感和主題。",
        "擁有墨佇特質的綠躍學生具有多角度思考的能力，從而發現獨特的靈感和創意。",
        "並熱衷於把自己的想法和觀點轉化為文字和故事，並透過精湛的筆力來激發讀者和觀眾的共鳴和思考。",
        "這些學生善於突破現有的框架和模式，以獨特的方式來表達自己，創作出新奇有趣的作品。",
      ],
      white: [
        "你喜歡嘗試不常見、難駕馭的人物性格，甚至會將各種矛盾古怪的特質放在角色身上，挑戰寫好這個角色。",
        "你會花費大量時間和精力來塑造每個角色的背景和性格，而且盡可能的讓角色看起來有趣。",
        "你可能會將自己的創新思維應用到不同的風格和領域中，不斷地嘗試新的可能性，並且以創造性的方式將其融入到自己的作品中。",
        "銀倚特質的綠躍學生可能會寫出以角色為本、充滿創意的作品，讀者可以在其中體驗到深度的角色塑造和獨特的故事情節。",
      ],
    },
  },

  blue: {
    main: [
      "你是一個極度注重邏輯和合理性的人，寫作時會花費大量心力查詢資料、考究背景、設計龐大而複雜的世界觀，以確保你的作品能夠呈現出完美的內在結構和脈絡。",
      "你喜歡用精確的邏輯推理和合理的設計，將作品的細節鋪排得井然有序，進而展現出作品內在的邏輯關聯性。",
      "你力求讓故事逼真寫實，即使是奇幻或科幻作品，也希望它們像真實存在的另一個世界。",
      "並且忍受不了一些作品對讀者智商的低估，這也是你忍不住提筆自己寫文的原因之一。",
      "你對自己的作品非常挑剔，希望能夠創造出更加完美、精細的世界觀和情節，讓讀者在閱讀過程中能夠完全沉浸在其中。",
      "儘管如此，你並不是一個呆板無趣毫無情調的作者。",
      "相反地，你為了將離奇的設定和轉折的情感合理化，經常創造出更有趣的世界觀和情節。",
      "但藍行學生通常是個細節控，要注意不要過度解釋，否則可能會拖延節奏，讓讀者失去耐心。",
      "同時藍行學生還是個設定控，往往會設定寫得比正文還多，也因此容易出現龐大設定和構想導致正文寫不完而棄坑的現象，請注意不要成為渣作者。",
    ],
    pureView: [
      "藍行學院的人注重故事的可信度，常常為寫作花很大的力氣做準備工作，有很多的資料夾放設定、參考資料。以確保故事的真實性和可信度。",
      "對於紅馳學院，藍行人會羨慕他們的高產，也認為他們善於將故事變得更具有商業價值，但同時認為紅馳作品只有少數在細節上經得起推敲。",
      "對於綠躍學院，藍行人會欣賞他們的獨創性和想像力，但有時可能會覺得他們的作品缺乏邏輯性和一些必要的細節設定。",
      "對於銀倚學院，藍行人會欣賞他們對人物設定和情感描寫的敏感度和深度，但有時可能會覺得他們的故事結構不夠緊湊和精確。",
      "對於墨佇學院，藍行人相較會比較喜歡墨佇的作品。認為墨佇作品在文學性和文筆方面非常出色，能夠令人一讀難忘，著很好的篇章結構和叙述技巧，能夠精煉地表達複雜的情感和思想，此外，墨佇的作品也常常探討社會議題，讓人深入思考。",
      "不過，藍行人也認為墨佇有時可能會太過注重情感細節，而忽略了其他方面的細節和設定。",
    ],
    hybrids: {
      red: [
        "你具有嚴謹的邏輯思維，注重細節、寫作時精益求精，並且能夠通過合理的推理和脈絡，將故事和情節合理化。",
        "寫作風格講究細節，注重劇情的合理性和邏輯性，並且能夠將商業元素巧妙地融入故事中。",
        "同時善於觀察市場趨勢和消費者需求，能夠從中找到商業機會並加以利用。",
        "具有紅馳特質的藍行學生擅長從商業角度出發思考寫作，能夠從市場需求中挖掘創作靈感，將作品打造成商業上的成功之作。",
      ],
      green: [
        "你擅長將複雜的資訊進行分類、整合和結構化，以確保作品內在的邏輯性和連貫性。",
        "同時也能夠善用創意，將這些分類、整合和結構化的元素妥善地組合在一起，創造出獨特、新穎和引人入勝的作品。",
        "注重邏輯性和合理性，同時也喜歡挑戰常規，創造出奇特而有趣的設定和情節，因此會花費大量心力將這些奇特的設定系統化，使其看起來有條有理，煞有其事，讓讀者不會感到設定脫離現實或過於離奇。",
        "具有綠躍特質的藍行學生既注重作品的創意和新奇感，又重視作品的邏輯性和合理性，能夠將獨特而奇特的設定和情節系統化，創造出具有深度和意義的作品，同時吸引讀者的注意力。",
      ],
      black: [
        "你能夠維持故事結構的合理性和邏輯性。你花費大量的時間查詢資料，設計複雜的世界觀，並運用豐富的文學素養來創造嚴謹的、充滿詩意的文學作品。",
        "同時能將細緻的文學風格和邏輯的思考方式相互結合，以充滿詩意的方式呈現作品的細節並且排列有條理。",
        "作為一位具有墨佇特質的藍行學生，你注重合理性和合乎邏輯的故事結構，同時運用各種文學技巧來豐富故事的真實感。",
        "你用邏輯和合理性來支撐作品的情節和角色設計，並創造出充滿詩意的文字，使作品更加具有說服力和深度。",
      ],
      white: [
        "你很注重作品內在的邏輯結構和脈絡，非常有條理的思維方式，精確的邏輯推理和設計，以確保作品的細節井然有序地展開，並且注重將作品中的細節和情節合理化。",
        "同時注重角色塑造，會花費大量時間和精力來刻畫每個角色的背景和性格，讓角色的行動和決定自然而然地推動故事劇情，這顯示你對於角色的心理和行為有非常深入的研究和考量。",
        "擁有銀倚特質的藍行學生通常非常注重人的心理和行為，對於角色和情節都有深入的研究和考量，同時具有非常有條理的思維方式，注重作品的邏輯結構和細節鋪排。",
        "通常會有精心設計的世界觀和角色，或是在角色間建立複雜的關係，並且在情節發展中逐漸揭示真相，讓讀者沉浸在細膩真實的故事中。",
      ],
    },
  },

  black: {
    main: [
      "你們是真正玩文字的人，很認真的雕琢文字，比起一般以小說形式為載體的學院，你們有更多詩、詞、散文的變化，你們也是最懂文學之美的人。",
      "墨佇學院的學生對於文學的熱愛和追求是毋庸置疑的。",
      "你們對於文字的每一個細節都非常講究，注重細膩的筆觸和優美的句式，通常會花費很長時間去打磨自己的作品，力求做到最好。",
      "在墨佇學院，你們能夠感受到一種濃厚的文學氛圍，這裡不僅是文字的天地，更是靈感和創造力的激發之所。",
      "墨佇學院的學生經常運用各種文學技巧來豐富作品的表達，如使用比喻、隱喻、象徵等手法，使作品更加詩意盎然，充滿韻律感。",
      "此外，墨佇的學生也常常在作品中探討深刻的主題和情感，這些主題往往涉及到人生、自我、社會等多個方面，並且會帶給讀者強烈的共鳴和思考。",
      "墨佇學院的學生有著很高的文學素養，經常閱讀各種文學作品，並且能夠深刻地理解和體驗作品中的意義和情感。",
      "這種高度的素養和敏銳的感受力，使得墨佇的學生在創作中能夠充分地發揮自己的才華，將自己的情感和思考用最為優美的語言表達出來。",
      "正是因為這種不斷地追求文學之美的精神，使得墨佇的學生成為了一群守護文學的人，並且將文學之美傳承下去。",
    ],
    pureView: [
      "墨佇學院的人對於作品有著很高的要求，不僅在於文筆的優美，更在於作品本身的深度和意義。",
      "在墨佇學院的眼中，其他學院的作品稍微缺乏深度和意義，但僅作為閱讀者時，你們不介意這些。",
      "然而你們自己創作時，你們相信一個良好的故事必須擁有一個有力的中心思想，並通過角色、情節和世界觀的細節來加強這種思想。",
      "對墨佇學生而言，每一個情節和角色都應該被細致地構思和設計，並且必須與主題和故事的情感內容相符合。",
      "你們也喜歡藍行作品，你們和藍行有部分的屬性相合，都能為作品做出非常多的研究。",
      "你們欣賞藍行學院的考究和細節設計，認為他們擅長表現故事的深度和複雜性。不過，你們也認為藍行作品有時會過於複雜和冗長，缺乏簡潔和清晰的元素。",
      "對你們來說，紅馳學院的作品注重商業市場和讀者喜好，擅長編寫通俗易懂的故事。不過，你們也認為紅馳作品有時會過於流俗和平庸，缺乏文學性和文筆上的提升。",
      "墨佇人欣賞綠躍學院的創意和幽默感，認為他們擅長用輕鬆有趣的方式呈現故事。不過，你們也認為綠躍作品有時會過於草率和表面化，缺乏深度和意義。",
      "至於銀倚學院，你們欣賞他們的角色設計和情感描寫，認為他們擅長表現人物的複雜內心和情感細節。但認為銀倚作品有時流於情愛，缺乏更多其他元素和議題。",
    ],
    hybrids: {
      red: [
        "不僅能夠通過精湛的文筆和詩意的表達來打動讀者和觀眾。他擅長運用象徵和隱喻等文學技巧，表現主題和情感，使作品更具有深度和內涵。",
        "同時懂得市場調研和分析，能夠從市場和觀眾的角度出發，寫出容易被大眾接受的作品。可以很好地掌握作品的節奏、懸念和高潮，使故事更具有吸引力和感染力。",
        "你的作品既具有文學性和深度，同時又能夠從市場和觀眾的需求出發，創作出容易被接受的作品。作品能夠打動人心，並且有可能被轉化為其他媒體形式。",
      ],
      green: [
        "你在文學方面非常有天賦，擅長運用精湛的文筆和詩意的表達方式，透過獨特的風格和手法來描繪出作品中的情感和主題。",
        "同時具有獨特的創意和想象力，能夠打破傳統的文學模式，創作出新穎的故事情節和角色形象，使作品更加生動有趣。",
        "擁有綠躍特質的墨佇學生具有多角度思考的能力，從而發現獨特的靈感和創意。",
        "並熱衷於把自己的想法和觀點轉化為文字和故事，並透過精湛的筆力來激發讀者和觀眾的共鳴和思考。",
        "這些學生善於突破現有的框架和模式，以獨特的方式來表達自己，創作出新奇有趣的作品。",
      ],
      blue: [
        "你擅長將細緻的文學風格和邏輯的思考方式相互結合，以充滿詩意的方式呈現作品的細節並且排列有條理。",
        "同時，你也能夠維持故事結構的合理性和邏輯性。你花費大量的時間查詢資料，設計複雜的世界觀，並運用豐富的文學素養來創造嚴謹的、充滿詩意的文學作品。",
        "作為一位具有藍行特質的墨佇學生，你運用各種文學技巧來豐富故事的真實感，同時保持作品內在的邏輯關聯性。",
        "你創造出充滿詩意的文字，並用邏輯和合理性來支撐作品的情節和角色設計，使作品更加具有說服力和深度。",
      ],
      white: [
        "你很重視文字的細節和優美的表達方式，會運用各種文學技巧來表達作品中的情感，如比喻、隱喻、象徵等手法，讓作品更加詩意盎然，充滿韻律感。",
        "也非常注重角色的心理和行動，並會花費大量的時間和精力來塑造每個角色的背景和性格。",
        "銀倚特質的墨佇學生擁有非常高的文學素養和敏銳的感受力，能夠在創作中充分地發揮自己的才華，用最為優美的語言表達出自己的情感和思考。",
        "也喜歡探討深刻的主題和情感，可能會涉及到人生、自我、社會等多個方面，讓角色更有層次，塑造出細膩又真實的作品。",
      ],
    },
  },

  white: {
    main: [
      "你是一位注重角色心理描寫和互動的人，對人性的觀察和刻劃有著敏銳的洞察力。",
      "在創作中，你以人為本，深入挖掘角色的內心，透過角色的行為和思維來表現作品的主題和情感。",
      "你認為一個好的劇情是從角色的行動和反應中開始的，這些行動和反應展現了角色的性格、目標和動機。",
      "因此，你的故事中的劇情往往是由角色的行動和決定驅動的，每一個場景都是為了展示角色的成長和發展而存在的。",
      "你會花費大量的時間和精力來塑造每個角色的背景和性格，並且讓他們的行動和決定看起來自然而然，且緊扣故事主題。",
      "你相信一個好的角色塑造是創作成功的關鍵，因為角色的鮮明和真實感能夠引起讀者的共鳴和情感投入，讓故事更加引人入勝。",
      "你像是有種特殊技能，讓角色在你的腦海中活生生地說話，就像是擁有自己的靈魂一樣。",
      "對你而言，角色不僅僅是作品中的角色，而是你的孩子，你會認真地刻畫筆下的每個角色，讓劇情也相應為角色而生。",
    ],
    pureView: [
      "銀倚學院的人創作喜歡以人為出發點，劇情皆是以角色推動，對你來說角色設定完，劇情就自然而然形成了。",
      "銀倚人是跟所有學院相處最來的人，畢竟角色本來就是無論哪個學院都需要認真對待的重點之一。",
      "當然也有先設計劇情再決定人設的操偶型作者，那樣的作者通常分布在藍行和紅馳，可能綠躍也有一些。",
      "在你們眼中，這種類型的故事人物相較沒有魅力，但若劇情夠好你們也能接受。",
      "一些情感張力渲染很好的紅馳作品很得銀倚人青睞，雖然以商業市場為導向的創作風格可能會讓你們不認同，覺得過於偏重於表面的娛樂性而忽略了角色內心的探索。不過如果劇情和角色設計精彩、引人入勝，你們仍然能夠被吸引和感動。",
      "同樣情感刻劃深刻的墨佇作品也是。銀倚的人物設定和故事劇情通常比較著重於人物關係和情感描寫，而墨佇的作品則更多地聚焦於社會問題和人性探討。因此，在銀倚學院的人看來，墨佇的作品有時會顯得有些過於沉重和嚴肅。",
      "另外，對於注重有趣和創意的綠躍，他們認為人物的魅力是有趣大於真實人性的刻劃。因此，對你們來說綠躍的人物設計可能相較輕浮，缺乏真實的人性深度。不過，綠躍學院中也會有很多有趣且兼具真實人性的人物設計案例，你們也會欣賞和喜愛。",
      "而藍行的考究能力通常能寫出不錯的人物，但因為他們通常更注重故事背景細節設定，對你們來說藍行的人物可能旁枝細節設定過多，因此複雜而讓人感到疏遠。",
    ],
    hybrids: {
      red: [
        "你不僅注重角色的心理描寫和互動，善於利用角色的情感和心理狀態來推進劇情的發展，打造角色魅力。你很清楚怎麼塑造大家都喜愛的角色。",
        "同時將市場調研和分析作為創作的一個重要步驟，從觀眾的喜好和需求出發，創作出容易被市場接受和喜愛的作品。",
        "這樣的學生能夠創作出引人入勝的故事情節，同時在角色塑造上有深入的思考和挖掘。",
        "具有高度紅馳特質的銀倚學生是最受市場歡迎的，你們的作品往往黏性很高，令讀者沉迷其中。",
      ],
      green: [
        "你會花費大量時間和精力來塑造每個角色的背景和性格，而且盡可能的讓角色看起來有趣。",
        "你喜歡嘗試不常見、難駕馭的人物性格，甚至會將各種矛盾古怪的特質放在角色身上，挑戰寫好這個角色。",
        "你可能會將自己的創新思維應用到不同的風格和領域中，不斷地嘗試新的可能性，並且以創造性的方式將其融入到自己的作品中。",
        "綠躍特質的銀倚學生可能會寫出以角色為本、充滿創意的作品，讀者可以在其中體驗到深度的角色塑造和獨特的故事情節。",
      ],
      blue: [
        "你很注重角色塑造，會花費大量時間和精力來刻畫每個角色的背景和性格，讓角色的行動和決定自然而然地推動故事劇情，這顯示你對於角色的心理和行為有非常深入的研究和考量。",
        "同時重作品內在的邏輯結構和脈絡，非常有條理的思維方式，精確的邏輯推理和設計，以確保作品的細節井然有序地展開，並且注重將作品中的細節和情節合理化。",
        "擁有藍行特質的銀倚學生通常非常注重人的心理和行為，對於角色和情節都有深入的研究和考量，同時具有非常有條理的思維方式，注重作品的邏輯結構和細節鋪排。",
        "通常會有精心設計的世界觀和角色，或是在角色間建立複雜的關係，並且在情節發展中逐漸揭示真相，讓讀者沉浸在細膩真實的故事中。",
      ],
      black: [
        "你非常注重角色的心理和行動，並會花費大量的時間和精力來塑造每個角色的背景和性格。",
        "同時很重視文字的細節和優美的表達方式，會運用各種文學技巧來表達作品中的情感，如比喻、隱喻、象徵等手法，讓作品更加詩意盎然，充滿韻律感。",
        "墨佇特質的銀倚學生擁有敏銳的感受力和極高的文學素養，能夠在創作中充分地發揮自己的才華，用最為優美的語言表達出自己的情感和思考。",
        "也喜歡探討深刻的主題和情感，可能會涉及到人生、自我、社會等多個方面，讓角色更有層次，塑造出細膩又真實的作品。",
      ],
    },
  },
};

// ── 本學院中文名稱（供 title 用）──────────────────────────────────────────
const ACADEMY_ZH_NAMES = {
  red: "紅馳",
  green: "綠躍",
  blue: "藍行",
  black: "墨佇",
  white: "銀倚",
};

// ── 純種視角標題 ────────────────────────────────────────────────────────────
const PURE_VIEW_TITLES = {
  red: "純種紅馳人視角",
  green: "純種綠躍人視角",
  blue: "純種藍行人視角",
  black: "純種墨佇人視角",
  white: "純種銀倚人視角",
};

// ── 入口 ────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const wrap = document.getElementById("result-wrap");
  if (!wrap) return;

  const key = getAcademyParam();
  if (!key) {
    wrap.innerHTML =
      '<p style="text-align:center;padding:3rem;opacity:.6;">找不到學院參數，請從測驗頁連結進入。</p>';
    return;
  }

  document.body.classList.add("theme-" + key);
  document.title = `【字命學院】測試結果──${ACADEMY_ZH_NAMES[key]}`;

  renderContent(key);
  document.addEventListener("langChanged", () => {
    updateWinnerName(key);
    const stage = document.querySelector(".result-reveal-stage");
    if (stage?.dataset.revealState !== "act1") {
      renderAcademyBookshelf(readLatestScores(), key);
    }
    renderGlobalAcademyStats(globalCountsCache, key, globalTotalCache);
  });
  loadGlobalAcademyStats(key);
});

function getAcademyParam() {
  const p = new URLSearchParams(window.location.search).get("academy");
  return ACADEMY_CONTENT[p] ? p : null;
}

// ── 渲染全頁內容 ────────────────────────────────────────────────────────────
function renderContent(key) {
  const data = ACADEMY_CONTENT[key];
  const zhName = ACADEMY_ZH_NAMES[key];
  const wrap = document.getElementById("result-wrap");

  const frag = document.createDocumentFragment();

  const heading = el("h2", { style: "opacity:0.8;" }, "你的學院測試");
  heading.setAttribute("data-reveal", "act1");
  frag.appendChild(heading);

  const content = el("div", { className: "res_content result-reveal-stage" });

  const resultTitle = el(
    "h2",
    { className: "res_title", style: "font-size:2.5rem;margin-bottom:30px;" },
    "測試結果",
  );
  resultTitle.setAttribute("data-reveal", "act1");
  content.appendChild(resultTitle);

  const skipRevealBtn = el("button", {
    className: "res_btn result-reveal-skip",
    type: "button",
  });
  skipRevealBtn.setAttribute("data-i18n-key", "revealSkip");
  content.appendChild(skipRevealBtn);

  const winnerBox = el("div", { className: "result-winner-box" });
  winnerBox.setAttribute("data-reveal", "act1");
  const winnerLabel = el("p", {
    className: "result-winner-label",
    id: "result-winner-label",
  });
  winnerLabel.setAttribute("data-i18n-key", "resultTopLabel");
  const winnerName = el("span", {
    className: "result-winner-name",
    id: "result-winner-name",
  });
  winnerBox.appendChild(winnerLabel);
  winnerBox.appendChild(winnerName);
  content.appendChild(winnerBox);

  const scoreWrap = el("div", { className: "score-chart-container" });
  scoreWrap.setAttribute("data-reveal", "act2");
  const scoreTitle = el("h3", {});
  scoreTitle.setAttribute("data-i18n-key", "scoreChartTitle");
  const shelf = el("div", {
    id: "academyBookShelf",
    className: "academy-bookshelf-container",
  });
  scoreWrap.appendChild(scoreTitle);
  scoreWrap.appendChild(shelf);
  content.appendChild(scoreWrap);

  const reportWrap = el("div", { className: "result-report-wrap" });
  reportWrap.setAttribute("data-reveal", "act3");

  reportWrap.appendChild(makeBlock(`── ${zhName} ──`, data.main));
  reportWrap.appendChild(makeBlock(PURE_VIEW_TITLES[key], data.pureView));

  ACADEMY_ORDER.forEach((other) => {
    if (other === key) return;
    const hybridName = ACADEMY_ZH_NAMES[other];
    reportWrap.appendChild(
      makeBlock(`同分或次高分是${hybridName}`, data.hybrids[other]),
    );
  });

  const bgTitle = el("h2", { style: "margin-top:50px;" }, "");
  bgTitle.setAttribute("data-i18n-key", "resultBgTitle");
  reportWrap.appendChild(bgTitle);

  const btnNav = el("nav", { className: "result-actions-grid" });

  const row1 = el("div", { className: "result-actions-row" });
  const row2 = el("div", { className: "result-actions-row" });
  const row3 = el("div", {
    className: "result-actions-row result-actions-row-two",
  });
  const row4 = el("div", {
    className: "result-actions-row result-actions-row-single",
  });

  const retakeBtn = el("button", { className: "res_btn" });
  retakeBtn.classList.add("action-card");
  retakeBtn.setAttribute("data-i18n-key", "retakeText");
  retakeBtn.onclick = () => {
    window.location.href = "index.html";
  };

  const LINK_DEFS = [
    {
      href: "https://www.penana.com/story/16766/",
      text: "從Penana入學",
      row: row1,
    },
    {
      href: "https://www.kadokado.com.tw/book/1425",
      text: "從KadoKado入學",
      row: row1,
    },
    {
      href: "https://cxc.today/zh/store/ApatiteBlue/work/20217",
      text: "從CXC入學",
      row: row1,
    },
    {
      href: "https://www.facebook.com/TealizeWrite/",
      text: "從FB找學校創辦人",
      row: row2,
    },
    {
      href: "https://www.instagram.com/tealize_write/",
      text: "從IG找學校創辦人",
      row: row2,
    },
    {
      href: "https://www.plurk.com/Tealize",
      text: "從Plurk找學校創辦人",
      row: row2,
    },
    {
      href: "about.html",
      i18nKey: "aboutLinkText",
      text: "測驗與學院設計",
      row: row3,
    },
    {
      href: "https://tealize-write.github.io/",
      i18nKey: "creatorBase",
      text: "學校創辦人的基地",
      row: row3,
    },
  ];

  LINK_DEFS.forEach(({ href, text, i18nKey, row }) => {
    const link = el("a", {
      href,
      className: "res_btn action-card",
      target: "_blank",
    });
    if (i18nKey) link.setAttribute("data-i18n-key", i18nKey);
    else link.textContent = text;
    bindTrackedLink(link, text, key);
    row.appendChild(link);
  });

  row4.appendChild(retakeBtn);

  btnNav.appendChild(row1);
  btnNav.appendChild(row2);
  btnNav.appendChild(row3);
  btnNav.appendChild(row4);

  reportWrap.appendChild(btnNav);

  const globalStatsWrap = el("div", { className: "score-chart-container" });
  const globalStatsTitle = el("h3", {});
  globalStatsTitle.setAttribute("data-i18n-key", "academyGlobalStatsTitle");
  const globalStatsTotal = el("p", {
    id: "academyGlobalStatsTotal",
    className: "academy-global-total",
  });
  const globalShelf = el("div", {
    id: "academyGlobalBookShelf",
    className: "academy-bookshelf-container",
  });
  globalStatsWrap.appendChild(globalStatsTitle);
  globalStatsWrap.appendChild(globalStatsTotal);
  globalStatsWrap.appendChild(globalShelf);
  reportWrap.appendChild(globalStatsWrap);

  content.appendChild(reportWrap);
  frag.appendChild(content);
  wrap.appendChild(frag);

  updateWinnerName(key);
  if (typeof applyLang === "function") applyLang(window.currentLang);
  startRevealSequence(key, content, skipRevealBtn);
}

function updateWinnerName(key) {
  const winnerNameEl = document.getElementById("result-winner-name");
  if (!winnerNameEl) return;
  const names = window.UI_TRANSLATIONS?.[window.currentLang]?.academyNames;
  winnerNameEl.textContent = names?.[key] || ACADEMY_ZH_NAMES[key] || key;
}

function startRevealSequence(key, content, skipBtn) {
  // Reveal order: act1 winner -> act2 score bars -> act3 full report.
  clearRevealTimers();

  const showAct = (act) => {
    content.dataset.revealState = act;
  };

  const revealAll = () => {
    clearRevealTimers();
    showAct("act3");
    renderAcademyBookshelf(readLatestScores(), key);
    skipBtn?.classList.add("is-hidden");
  };

  skipBtn?.addEventListener("click", revealAll, { once: true });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealAll();
    return;
  }

  showAct("act1");
  revealTimers.push(
    setTimeout(() => {
      showAct("act2");
      renderAcademyBookshelf(readLatestScores(), key);
    }, REVEAL_ACT2_DELAY_MS),
  );
  revealTimers.push(
    setTimeout(() => {
      showAct("act3");
      skipBtn?.classList.add("is-hidden");
    }, REVEAL_ACT3_DELAY_MS),
  );
}

function clearRevealTimers() {
  revealTimers.forEach((id) => clearTimeout(id));
  revealTimers = [];
}

function makeBlock(title, paragraphs) {
  const div = el("div", { className: "res_ack" });
  div.appendChild(el("span", { className: "res_ack-title" }, title));
  paragraphs.forEach((text) => {
    div.appendChild(el("p", { className: "res_ack-desc" }, text));
  });
  return div;
}

function readLatestScores() {
  try {
    const raw = sessionStorage.getItem("latestAcademyScores");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      !Array.isArray(parsed.scores) ||
      parsed.scores.length !== 5
    ) {
      return null;
    }
    return parsed.scores.map((n) => Number(n) || 0);
  } catch {
    return null;
  }
}

function postActionLog(action, keyword, timeSpent = 0) {
  if (!GAS_URL || GAS_URL.startsWith("__")) return;
  const location = getLocationPayload();
  const payload = {
    timestamp: new Date().toISOString(),
    clientId: getClientId(),
    keyword: keyword || "",
    action,
    source: getTrafficSource(),
    referrer: document.referrer || "",
    device: getDeviceType(),
    country: location.country,
    city: location.city,
    timeSpent: Number(timeSpent) || 0,
  };
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
    navigator.sendBeacon(GAS_URL, blob);
    return;
  }
  fetch(GAS_URL, {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "text/plain" },
    body,
  }).catch(() => {});
}

function bindTrackedLink(link, actionText, keyword) {
  link.addEventListener("click", (e) => {
    postActionLog(actionText, keyword, 0);

    const href = link.getAttribute("href");
    const target = link.getAttribute("target");

    e.preventDefault();
    if (target === "_blank") {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      setTimeout(() => {
        window.location.href = href;
      }, 120);
    }
  });
}

async function loadGlobalAcademyStats(activeKey) {
  const shelf = document.getElementById("academyGlobalBookShelf");
  if (!shelf) return;

  if (!GAS_URL || GAS_URL.startsWith("__")) {
    shelf.innerHTML = "";
    shelf.appendChild(
      el(
        "p",
        { className: "academy-bookshelf-empty" },
        "尚未設定 GAS 統計來源。",
      ),
    );
    return;
  }

  try {
    const res = await fetch(GAS_URL);
    const json = await res.json();
    globalCountsCache = json.counts || {};
    globalTotalCache = Number(json.total) || 0;
    renderGlobalAcademyStats(globalCountsCache, activeKey, globalTotalCache);
  } catch {
    shelf.innerHTML = "";
    shelf.appendChild(
      el(
        "p",
        { className: "academy-bookshelf-empty" },
        "讀取全體統計失敗，請稍後再試。",
      ),
    );
  }
}

function renderBarShelf(shelf, values, activeKey) {
  shelf.innerHTML = "";
  const names = window.UI_TRANSLATIONS[window.currentLang].academyNames;
  const academyColors = getAcademyColors();
  const max = Math.max(...values, 1);
  ACADEMY_ORDER.forEach((key, idx) => {
    const v = values[idx];
    const ratio = Math.max(8, Math.round((v / max) * 100));
    const row = el("div", {
      className: `academy-book-item${key === activeKey ? " is-top" : ""}`,
    });
    const bar = el("div", { className: "academy-book-bar" });
    const fill = el("span", { className: "academy-book-fill" });
    fill.style.height = "0%";
    fill.style.background = academyColors[key];
    bar.appendChild(fill);
    row.appendChild(bar);
    row.appendChild(
      el("span", { className: "academy-book-label" }, names[key]),
    );
    row.appendChild(el("span", { className: "academy-book-score" }, String(v)));
    shelf.appendChild(row);
    setTimeout(
      () => {
        fill.style.height = `${ratio}%`;
      },
      idx * 80 + 16,
    );
  });
}

function getAcademyColors() {
  if (window.ACADEMY_THEME?.getAcademyColors) {
    return window.ACADEMY_THEME.getAcademyColors();
  }
  return {
    red: "#d85f5f",
    green: "#91b66f",
    blue: "#4f78a8",
    black: "#7d5b85",
    white: "#c9c3b7",
  };
}

function renderGlobalAcademyStats(counts, activeKey, total) {
  const shelf = document.getElementById("academyGlobalBookShelf");
  const totalEl = document.getElementById("academyGlobalStatsTotal");
  if (!shelf || !totalEl) return;

  if (!counts) {
    totalEl.textContent = "";
    shelf.innerHTML = "";
    shelf.appendChild(
      el("p", { className: "academy-bookshelf-empty" }, "暫無全體統計資料。"),
    );
    return;
  }

  const values = ACADEMY_ORDER.map((k) => Number(counts[k]) || 0);
  totalEl.textContent =
    (window.currentLang === "en" ? "Total participants: " : "總參與人數：") +
    (total || values.reduce((a, b) => a + b, 0));
  renderBarShelf(shelf, values, activeKey);
}

function renderAcademyBookshelf(scoreList, activeKey) {
  const shelf = document.getElementById("academyBookShelf");
  if (!shelf) return;

  if (!scoreList) {
    shelf.innerHTML = "";
    shelf.appendChild(
      el(
        "p",
        { className: "academy-bookshelf-empty" },
        "請先完成測驗，即可顯示五學院分數。",
      ),
    );
    return;
  }

  renderBarShelf(shelf, scoreList, activeKey);
}

// ── 建立 DOM 元素的小工具 ───────────────────────────────────────────────────
function el(tag, props, text) {
  const node = document.createElement(tag);
  if (props) Object.assign(node, props);
  if (text !== undefined) node.textContent = text;
  return node;
}
