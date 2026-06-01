export type WeddingPrompt = {
  id: string;
  name: string;
  prompt: string;
  rawPrompt: string;
  aspectRatio: string;
  scene: string;
  pose: string;
  styleTags: string[];
  isCoverPrompt: boolean;
};

export type WeddingTheme = {
  themeId: string;
  themeName: string;
  themeDescription: string;
  suitableFor: string;
  defaultAspectRatio: string;
  coverImage?: string;
  coverImages?: string[];
  galleryImages?: string[];
  coverPrompt: string;
  prompts: WeddingPrompt[];
};

export type GenerationPromptPlan = {
  theme: WeddingTheme;
  prompt: WeddingPrompt;
  type: "normal" | "sweet_spot" | "recommendation";
  themeKey: string;
  promptIndex: number;
  promptTitle: string;
  isCoverPrompt: boolean;
};

type PromptSeed = Omit<WeddingPrompt, "id" | "isCoverPrompt">;
type ThemeSeed = Omit<WeddingTheme, "coverPrompt" | "prompts"> & { prompts: PromptSeed[] };

function makeTheme(seed: ThemeSeed): WeddingTheme {
  const prompts = seed.prompts.map((prompt, index) => ({
    ...prompt,
    id: `${seed.themeId}-${String.fromCharCode(97 + index)}`,
    isCoverPrompt: index === 0
  }));
  return { ...seed, coverPrompt: prompts[0].rawPrompt, prompts };
}

export const weddingThemes: WeddingTheme[] = [
  makeTheme({
    themeId: "minguo-profile-story",
    themeName: "民国芳华·侧颜叙事",
    themeDescription: "民国旗袍、旧上海室内光影和侧颜叙事感，画面克制而有年代情绪。",
    suitableFor: "适合喜欢复古、书卷气、电影感和含蓄东方美的用户。",
    defaultAspectRatio: "3:4",
    coverImage: "/demo/themes/minguo-profile-story/cover-1.jpg",
    coverImages: ["/demo/themes/minguo-profile-story/cover-1.jpg", "/demo/themes/minguo-profile-story/cover-2.jpg", "/demo/themes/minguo-profile-story/cover-3.jpg", "/demo/themes/minguo-profile-story/cover-4.jpg", "/demo/themes/minguo-profile-story/cover-5.jpg"],
    galleryImages: ["/demo/themes/minguo-profile-story/1.jpg", "/demo/themes/minguo-profile-story/2.jpg", "/demo/themes/minguo-profile-story/3.jpg", "/demo/themes/minguo-profile-story/4.jpg", "/demo/themes/minguo-profile-story/5.jpg"],
    prompts: [
      {
        name: "A",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。侧脸特写（Side-profile close-up），富士胶卷相片风格（Fuji Film Style），清冷通透。光线明暗对比强烈，呈现电影质感的人像光影故事。保留细腻胶片颗粒感，具有浓郁的回忆感。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用您上传的肖像。男性为新郎（民国贵公子气），女性为新娘（温婉优雅）。男性身形挺拔，颈部舒展，形体严禁佝偻。\n\n肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。新郎面如冠玉，英俊帅气，眼神清澈有神，严禁小眼睛或日本脸特征。\n\n二、造型细节\n\n新娘：身着白色蕾丝婚纱，面料质感细腻；佩戴精致的花饰头纱，头纱具有通透的轻盈感；发型为黑色复古盘发。佩戴高质感珍珠项链与珍珠饰品，折射出柔和珠光。\n\n新郎：穿着笔挺的黑色西装搭配精致领结。发型为黑色复古背头，打理得整洁油亮。妆容干净自然，呈现出民国时期的高级审美。\n\n三、场景与画质\n\n场景：古旧的中式木质背景（weathered wood background），木纹质感清晰。\n\n光影与画质：暖调侧光勾勒人物面部轮廓，侧脸线条流畅美观。脸部带有轻微的电影感漏光（light leaks）。面部温润哑光，坚决不能泛油光（matte finish only）。Negative Prompt: no oily skin, no overexposure, no small eyes for groom, no slouching, no bright green, no blurred face.\n\n四、分镜动作\n\nMedium close-up from a side profile perspective. The bride is leaning sweet and gently against the groom's shoulder, looking towards the lens with a happy, amiable expression. The groom is looking slightly away, showcasing his sharp jawline and noble posture. Intimate and nostalgic atmosphere. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。侧脸特写（Side-profile close-up），富士胶卷相片风格（Fuji Film Style），清冷通透。光线明暗对比强烈，呈现电影质感的人像光影故事。保留细腻胶片颗粒感，具有浓郁的回忆感。一、人物绑定（最高优先级）人物：严格使用您上传的肖像。男性为新郎（民国贵公子气），女性为新娘（温婉优雅）。男性身形挺拔，颈部舒展，形体严禁佝偻。肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。新郎面如冠玉，英俊帅气，眼神清澈有神，严禁小眼睛或日本脸特征。二、造型细节新娘：身着白色蕾丝婚纱，面料质感细腻；佩戴精致的花饰头纱，头纱具有通透的轻盈感；发型为黑色复古盘发。佩戴高质感珍珠项链与珍珠饰品，折射出柔和珠光。新郎：穿着笔挺的黑色西装搭配精致领结。发型为黑色复古背头，打理得整洁油亮。妆容干净自然，呈现出民国时期的高级审美。三、场景与画质场景：古旧的中式木质背景（weathered wood background），木纹质感清晰。光影与画质：暖调侧光勾勒人物面部轮廓，侧脸线条流畅美观。脸部带有轻微的电影感漏光（light leaks）。面部温润哑光，坚决不能泛油光（matte finish only）。Negative Prompt: no oily skin, no overexposure, no small eyes for groom, no slouching, no bright green, no blurred face.四、分镜动作Medium close-up from a side profile perspective. The bride is leaning sweet and gently against the groom's shoulder, looking towards the lens with a happy, amiable expression. The groom is looking slightly away, showcasing his sharp jawline and noble posture. Intimate and nostalgic atmosphere. --ar 3:4",
        aspectRatio: "3:4",
        scene: "民国芳华·侧颜叙事",
        pose: "A",
        styleTags: ["民国", "侧颜", "旧上海", "胶片"]
      },
      {
        name: "B",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：电影宽银幕（16:9）。利用全景深（Deep focus）展现中式回廊的前后纵深跨度。前后人物五官必须全部清晰，严禁虚焦。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用上传肖像。新郎形象英俊帅气，新娘温婉。形体美感严禁佝偻。\n\n肖像保真：100%还原。\n\n二、造型细节\n\n新娘：白色蕾丝婚纱，花饰头纱，珍珠配饰，手持柔和花束。\n\n新郎：黑色西装+领结，黑色复古背头，神态愉悦随和，身姿笔挺。\n\n三、场景与画质\n\n场景：中式园林木质回廊，利用透视关系，新娘在前景，新郎在后方数米远，空间感极强。\n\n光影与画质：全景深（Deep focus shot），所有人五官清晰锐利。面部温润哑光，杜绝油光。富士胶卷清冷感。Negative Prompt: blurred face, out of focus, no overexposure, no oily skin, no Japanese facial features, no small eyes for groom.\n\n四、分镜动作\n\nCinematic deep focus shot, the bride is in the foreground, turning back to smile cutely at the lens, her lace dress is sharp and clear. The groom stands meters behind her in the background of the wooden corridor, also in sharp focus, looking at her with a happy, playful gaze. --ar 16:9",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：电影宽银幕（16:9）。利用全景深（Deep focus）展现中式回廊的前后纵深跨度。前后人物五官必须全部清晰，严禁虚焦。一、人物绑定（最高优先级）人物：严格使用上传肖像。新郎形象英俊帅气，新娘温婉。形体美感严禁佝偻。肖像保真：100%还原。二、造型细节新娘：白色蕾丝婚纱，花饰头纱，珍珠配饰，手持柔和花束。新郎：黑色西装+领结，黑色复古背头，神态愉悦随和，身姿笔挺。三、场景与画质场景：中式园林木质回廊，利用透视关系，新娘在前景，新郎在后方数米远，空间感极强。光影与画质：全景深（Deep focus shot），所有人五官清晰锐利。面部温润哑光，杜绝油光。富士胶卷清冷感。Negative Prompt: blurred face, out of focus, no overexposure, no oily skin, no Japanese facial features, no small eyes for groom.四、分镜动作Cinematic deep focus shot, the bride is in the foreground, turning back to smile cutely at the lens, her lace dress is sharp and clear. The groom stands meters behind her in the background of the wooden corridor, also in sharp focus, looking at her with a happy, playful gaze. --ar 16:9",
        aspectRatio: "16:9",
        scene: "民国芳华·侧颜叙事",
        pose: "B",
        styleTags: ["民国", "侧颜", "旧上海", "胶片"]
      },
      {
        name: "C",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：电影宽银幕（16:9）。展现随意自然的动作与互动瞬间，强调回忆感与光影明暗对比。画面充满慵懒愉悦的电影氛围。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用您上传的肖像。男性身形挺拔直立，女性形体优雅修长。模特动作松弛但身姿严禁佝偻。\n\n肖像保真：100%还原原图。新郎面部轮廓清晰，拒绝小眼睛，拒绝日本脸特征。\n\n二、造型细节\n\n新娘：身着白色蕾丝婚纱，裙摆优雅散开；黑色复古盘发；佩戴花饰头纱与珍珠项链。新娘表情可爱自然，眼神充满幸福。\n\n新郎：笔挺黑西装，精致领结，黑色复古背头。配件（领结、珍珠、花束、复古行李箱）质感清晰逼真。\n\n三、场景与画质\n\n场景：中式园林石阶与木质墙壁，非对称构图。\n\n光影与画质：富士胶片颗粒感，清冷通透。身型展现光影下的曲线美，动作随性，严禁由于紧绷导致的佝偻。面部无油光，杜绝刺眼油光与死白过曝。Negative Prompt: overexposed highlights, greasy skin, hunchback, no small eyes, no blurred face, vibrant green background.\n\n四、分镜动作\n\nWide cinematic shot, the couple sitting casually on the edge of the vintage suitcase near the wooden wall. They are looking at each other and laughing heartily, the bride’s head is tilted back slightly. Natural light highlights high-end textures. Amiable mood. --ar 16:9",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：电影宽银幕（16:9）。展现随意自然的动作与互动瞬间，强调回忆感与光影明暗对比。画面充满慵懒愉悦的电影氛围。一、人物绑定（最高优先级）人物：严格使用您上传的肖像。男性身形挺拔直立，女性形体优雅修长。模特动作松弛但身姿严禁佝偻。肖像保真：100%还原原图。新郎面部轮廓清晰，拒绝小眼睛，拒绝日本脸特征。二、造型细节新娘：身着白色蕾丝婚纱，裙摆优雅散开；黑色复古盘发；佩戴花饰头纱与珍珠项链。新娘表情可爱自然，眼神充满幸福。新郎：笔挺黑西装，精致领结，黑色复古背头。配件（领结、珍珠、花束、复古行李箱）质感清晰逼真。三、场景与画质场景：中式园林石阶与木质墙壁，非对称构图。光影与画质：富士胶片颗粒感，清冷通透。身型展现光影下的曲线美，动作随性，严禁由于紧绷导致的佝偻。面部无油光，杜绝刺眼油光与死白过曝。Negative Prompt: overexposed highlights, greasy skin, hunchback, no small eyes, no blurred face, vibrant green background.四、分镜动作Wide cinematic shot, the couple sitting casually on the edge of the vintage suitcase near the wooden wall. They are looking at each other and laughing heartily, the bride’s head is tilted back slightly. Natural light highlights high-end textures. Amiable mood. --ar 16:9",
        aspectRatio: "16:9",
        scene: "民国芳华·侧颜叙事",
        pose: "C",
        styleTags: ["民国", "侧颜", "旧上海", "胶片"]
      },
      {
        name: "D",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。采用中近景平视构图，专业人像摄影质感。强调表情动作可爱，充满温柔甜蜜的幸福感。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用您上传的肖像。新郎形象英俊帅气，新娘温婉。形体挺拔不佝偻。\n\n肖像保真：100%沿用原图五官。人物眼神清澈，充满愉悦感。\n\n二、造型细节\n\n新娘：白色蕾丝婚纱，层叠细节分明；佩戴通透花饰头纱与珍珠配件，折射珠光。发型为黑色复古盘发。面部呈现温润哑光质感。\n\n新郎：纯黑色西装搭配精致领结，服饰剪裁挺括。发型为黑色复古背头。整体造型精致，展现民国贵公子气质。\n\n三、场景与画质\n\n场景：木质背景前的暖调光影。\n\n光影与画质：富士胶卷质感，脸部轻微漏光。画面坚决不能过曝，面部无油光。动作自然，心情愉悦随和。Negative Prompt: shiny forehead, oily face, no overexposure, no slouching, no expressionless face, groom's eyes too small, no Japanese style.\n\n四、分镜动作\n\nMedium shot, the couple standing close together, their heads touching. The bride is holding the bouquet up to her chin, her eyes sparkling with sweetness and joy. The groom is leaning his head slightly towards hers, looking into the lens with an amiable smile. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。采用中近景平视构图，专业人像摄影质感。强调表情动作可爱，充满温柔甜蜜的幸福感。一、人物绑定（最高优先级）人物：严格使用您上传的肖像。新郎形象英俊帅气，新娘温婉。形体挺拔不佝偻。肖像保真：100%沿用原图五官。人物眼神清澈，充满愉悦感。二、造型细节新娘：白色蕾丝婚纱，层叠细节分明；佩戴通透花饰头纱与珍珠配件，折射珠光。发型为黑色复古盘发。面部呈现温润哑光质感。新郎：纯黑色西装搭配精致领结，服饰剪裁挺括。发型为黑色复古背头。整体造型精致，展现民国贵公子气质。三、场景与画质场景：木质背景前的暖调光影。光影与画质：富士胶卷质感，脸部轻微漏光。画面坚决不能过曝，面部无油光。动作自然，心情愉悦随和。Negative Prompt: shiny forehead, oily face, no overexposure, no slouching, no expressionless face, groom's eyes too small, no Japanese style.四、分镜动作Medium shot, the couple standing close together, their heads touching. The bride is holding the bouquet up to her chin, her eyes sparkling with sweetness and joy. The groom is leaning his head slightly towards hers, looking into the lens with an amiable smile. --ar 3:4",
        aspectRatio: "3:4",
        scene: "民国芳华·侧颜叙事",
        pose: "D",
        styleTags: ["民国", "侧颜", "旧上海", "胶片"]
      },
      {
        name: "E",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。怀旧复古叙事感终曲，电影质感。展现行走间的形体美与愉悦的心情。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用您上传的肖像。男性身形笔挺如青松，女性形体优雅舒展。双人同框，男性明显高于女性。\n\n肖像保真：100%沿用原图五官、肤色，禁止修改。\n\n二、造型细节\n\n新娘：穿戴白色蕾丝婚纱，花饰头纱在微风中轻盈飘动；珍珠配件呈现真实的金属与珠光细节；黑色复古盘发。形体端庄优雅。\n\n新郎：穿着笔挺黑西装搭配精致领结。黑色复古背头，眼神清澈有神。身姿笔挺，展现高贵的贵族气质。\n\n三、场景与画质\n\n场景：园林月亮门（Moon gate），极简复古色块。\n\n光影与画质：4K电影写实感。画面光影平衡，严禁过曝。模特皮肤温润哑光，严禁泛油。人物表情随和愉快。Negative Prompt: 画面死白、面部泛油、模特佝偻驼背、表情木讷、日本脸特征、新郎眼睛过小、背景过绿。\n\n四、分镜动作\n\nFull body shot from a low perspective, the couple walking hand-in-hand through a classic moon gate. They are talking and smiling happily, looking at each other. Their silhouettes are sharp, upright, and graceful. Rich nostalgic tones. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。怀旧复古叙事感终曲，电影质感。展现行走间的形体美与愉悦的心情。一、人物绑定（最高优先级）人物：严格使用您上传的肖像。男性身形笔挺如青松，女性形体优雅舒展。双人同框，男性明显高于女性。肖像保真：100%沿用原图五官、肤色，禁止修改。二、造型细节新娘：穿戴白色蕾丝婚纱，花饰头纱在微风中轻盈飘动；珍珠配件呈现真实的金属与珠光细节；黑色复古盘发。形体端庄优雅。新郎：穿着笔挺黑西装搭配精致领结。黑色复古背头，眼神清澈有神。身姿笔挺，展现高贵的贵族气质。三、场景与画质场景：园林月亮门（Moon gate），极简复古色块。光影与画质：4K电影写实感。画面光影平衡，严禁过曝。模特皮肤温润哑光，严禁泛油。人物表情随和愉快。Negative Prompt: 画面死白、面部泛油、模特佝偻驼背、表情木讷、日本脸特征、新郎眼睛过小、背景过绿。四、分镜动作Full body shot from a low perspective, the couple walking hand-in-hand through a classic moon gate. They are talking and smiling happily, looking at each other. Their silhouettes are sharp, upright, and graceful. Rich nostalgic tones. --ar 3:4",
        aspectRatio: "3:4",
        scene: "民国芳华·侧颜叙事",
        pose: "E",
        styleTags: ["民国", "侧颜", "旧上海", "胶片"]
      }
    ]
  }),
  makeTheme({
    themeId: "hong-kong-1995",
    themeName: "1995港风",
    themeDescription: "90年代港风人像、浓郁胶片色彩、复古妆发和都市氛围。",
    suitableFor: "适合喜欢港片女主感、复古时髦、强记忆点照片的用户。",
    defaultAspectRatio: "4:5",
    coverImage: "/demo/themes/hong-kong-1995/cover-1.jpg",
    coverImages: ["/demo/themes/hong-kong-1995/cover-1.jpg", "/demo/themes/hong-kong-1995/cover-2.jpg", "/demo/themes/hong-kong-1995/cover-3.jpg", "/demo/themes/hong-kong-1995/cover-4.jpg", "/demo/themes/hong-kong-1995/cover-5.jpg"],
    galleryImages: ["/demo/themes/hong-kong-1995/1.jpg", "/demo/themes/hong-kong-1995/2.jpg", "/demo/themes/hong-kong-1995/3.jpg", "/demo/themes/hong-kong-1995/4.jpg", "/demo/themes/hong-kong-1995/5.jpg"],
    prompts: [
      {
        name: "A",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。1995年港风复古摄影。风格为经典90年代影楼、胶片质感。背景为纯色中国红幕布，色调偏暖红橙调，具有年代沉淀感。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用上传的肖像。女性为新娘，身形纤细。形体挺拔，严禁缩脖或佝偻。\n\n肖像保真：100%沿用原图五官、脸型、肤色。妆容为90年代港风，白皙偏哑光，正红色滋润唇膏。表情自然真实，含羞带笑。\n\n二、造型细节\n\n新娘：黑色长发港式盘发，头顶蓬松，点缀细小珍珠发饰；大红色多层欧根纱头纱，蓬松轻盈。身着大红色抹胸婚纱，胸口有立体褶皱花朵。配饰为珍珠项链与耳坠。手持粉色香水百合、红玫瑰组成的圆润手捧花。\n\n新郎：本张为单人特写，新郎不出现。\n\n三、场景与画质\n\n场景：纯红幕布背景。模拟90年代影楼闪光灯正面直闪效果，面部明亮均匀。\n\n画质与色调：模拟柯达胶卷ISO 400质感，轻微颗粒感，轻微暗角。红色正红偏橘，肤色暖粉调。Negative Prompt: overexposed, oily skin, digital sharp, slouching, Japanese features, modern style, cold tones.\n\n四、分镜动作\n\nClose-up shot. The bride is looking towards the lens with a shy and gentle smile, her head slightly tilted. She holds the bouquet to her chest. Her face is sharp and clear with a matte finish. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。1995年港风复古摄影。风格为经典90年代影楼、胶片质感。背景为纯色中国红幕布，色调偏暖红橙调，具有年代沉淀感。一、人物绑定（最高优先级）人物：严格使用上传的肖像。女性为新娘，身形纤细。形体挺拔，严禁缩脖或佝偻。肖像保真：100%沿用原图五官、脸型、肤色。妆容为90年代港风，白皙偏哑光，正红色滋润唇膏。表情自然真实，含羞带笑。二、造型细节新娘：黑色长发港式盘发，头顶蓬松，点缀细小珍珠发饰；大红色多层欧根纱头纱，蓬松轻盈。身着大红色抹胸婚纱，胸口有立体褶皱花朵。配饰为珍珠项链与耳坠。手持粉色香水百合、红玫瑰组成的圆润手捧花。新郎：本张为单人特写，新郎不出现。三、场景与画质场景：纯红幕布背景。模拟90年代影楼闪光灯正面直闪效果，面部明亮均匀。画质与色调：模拟柯达胶卷ISO 400质感，轻微颗粒感，轻微暗角。红色正红偏橘，肤色暖粉调。Negative Prompt: overexposed, oily skin, digital sharp, slouching, Japanese features, modern style, cold tones.四、分镜动作Close-up shot. The bride is looking towards the lens with a shy and gentle smile, her head slightly tilted. She holds the bouquet to her chest. Her face is sharp and clear with a matte finish. --ar 3:4",
        aspectRatio: "3:4",
        scene: "1995港风",
        pose: "A",
        styleTags: ["港风", "1995", "复古", "胶片"]
      },
      {
        name: "B",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清构图（3:2）。捕捉两人幸福自然的互动，强调90年代影楼常见的温馨站位。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用上传肖像。新郎身高175cm，挺拔英挺，新娘纤细优雅。新郎略高于新娘，比例协调。双人神态随和，笑容灿烂。\n\n肖像保真：100%还原。新郎发型为90年代港星中分蓬松造型，眼神温柔聚焦，严禁日本脸特征。\n\n二、造型细节\n\n新娘：红色抹胸蓬蓬裙，珍珠配饰，手捧花置于腰前。\n\n新郎：黑色双排扣西装，垫肩廓形明显，白色尖领衬衫配红底格纹领带，左胸别红玫瑰胸花。黑色亮面皮鞋细节清晰，发型按@Image 保持。\n\n三、场景与画质\n\n场景：纯色红幕背景。\n\n画质与色调：胶片特有的黑色层次分明，西装质感浓郁。高光不过曝，对比度适中偏柔。Negative Prompt: oily forehead, shiny skin, overexposure, slouching, Japanese features, small eyes, modern digital look.\n\n四、分镜动作\n\nMedium shot. The groom stands behind the bride to her right, his hands resting gently on her shoulders, leaning in slightly. Both are looking at the lens with natural, happy smiles. The atmosphere is festive and elegant. --ar 3:2",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清构图（3:2）。捕捉两人幸福自然的互动，强调90年代影楼常见的温馨站位。一、人物绑定（最高优先级）人物：严格使用上传肖像。新郎身高175cm，挺拔英挺，新娘纤细优雅。新郎略高于新娘，比例协调。双人神态随和，笑容灿烂。肖像保真：100%还原。新郎发型为90年代港星中分蓬松造型，眼神温柔聚焦，严禁日本脸特征。二、造型细节新娘：红色抹胸蓬蓬裙，珍珠配饰，手捧花置于腰前。新郎：黑色双排扣西装，垫肩廓形明显，白色尖领衬衫配红底格纹领带，左胸别红玫瑰胸花。黑色亮面皮鞋细节清晰，发型按@Image 保持。三、场景与画质场景：纯色红幕背景。画质与色调：胶片特有的黑色层次分明，西装质感浓郁。高光不过曝，对比度适中偏柔。Negative Prompt: oily forehead, shiny skin, overexposure, slouching, Japanese features, small eyes, modern digital look.四、分镜动作Medium shot. The groom stands behind the bride to her right, his hands resting gently on her shoulders, leaning in slightly. Both are looking at the lens with natural, happy smiles. The atmosphere is festive and elegant. --ar 3:2",
        aspectRatio: "3:2",
        scene: "1995港风",
        pose: "B",
        styleTags: ["港风", "1995", "复古", "胶片"]
      },
      {
        name: "C",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。捕捉温馨私密的亲昵瞬间。由于是近景，对皮肤质感和面部表情的真实度要求极高。\n\n一、人物绑定（最高优先级）\n\n人物：两人面面相觑，额头轻轻相触。神态随和，充满幸福感。严禁肢体穿模或五官畸变。\n\n肖像保真：100%还原。闭眼或含笑对视时，肌肉线条自然。\n\n二、造型细节（保持统一）：红色婚纱欧根纱细节，珍珠首饰，黑色西装领口。\n\n三、场景与画质\n\n光影与画质：面部有柔和的阴影过渡。温润哑光皮感。Negative Prompt: shiny face, greasy forehead, overexposure, distorted eyes, bad proportions, modern digital style.\n\n四、分镜动作\n\nClose-up shot of the couple's upper chest and faces. Their foreheads are touching gently, eyes closed with serene, happy smiles. The dark red curtain provides a warm, romantic background. Extremely intimate and sentimental moment. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。捕捉温馨私密的亲昵瞬间。由于是近景，对皮肤质感和面部表情的真实度要求极高。一、人物绑定（最高优先级）人物：两人面面相觑，额头轻轻相触。神态随和，充满幸福感。严禁肢体穿模或五官畸变。肖像保真：100%还原。闭眼或含笑对视时，肌肉线条自然。二、造型细节（保持统一）：红色婚纱欧根纱细节，珍珠首饰，黑色西装领口。三、场景与画质光影与画质：面部有柔和的阴影过渡。温润哑光皮感。Negative Prompt: shiny face, greasy forehead, overexposure, distorted eyes, bad proportions, modern digital style.四、分镜动作Close-up shot of the couple's upper chest and faces. Their foreheads are touching gently, eyes closed with serene, happy smiles. The dark red curtain provides a warm, romantic background. Extremely intimate and sentimental moment. --ar 3:4",
        aspectRatio: "3:4",
        scene: "1995港风",
        pose: "C",
        styleTags: ["港风", "1995", "复古", "胶片"]
      },
      {
        name: "D",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。半身取景，展现90年代影楼婚纱摄影的宏大气场与完整造型。\n\n一、人物绑定（最高优先级）\n\n人物：新郎175cm且明显高于新娘，形体端正挺拔。双人并肩，身体轻靠，展现喜庆氛围。\n\n肖像保真：100%还原。新郎发型固定，拒绝眯眯眼。\n\n二、造型细节\n\n新娘：大红色抹胸蓬蓬裙婚纱，裙摆体积感庞大，层叠细节清晰。白色蕾丝缎带包扎的手捧花置于身前。\n\n新郎：黑色双排扣西装，黑色亮面尖头皮鞋。造型干净极致，展现端庄稳重。\n\n三、场景与画质\n\n场景：中国红幕布，纯净无杂物。\n\n画质与光影：整体暖色调。红色呈现正红偏橘。暗部细节丰富，胶片感十足。Negative Prompt: 画面死白, 面部泛油, 模特佝偻, 日本脸, 现代感, 荧光红, 杂乱背景.\n\n四、分镜动作\n\nFull body shot. The couple standing side-by-side in front of the red curtain. The groom’s arm is naturally around the bride’s waist. Both look into the camera with bright, joyful smiles. Majestic 90s studio composition. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。半身取景，展现90年代影楼婚纱摄影的宏大气场与完整造型。一、人物绑定（最高优先级）人物：新郎175cm且明显高于新娘，形体端正挺拔。双人并肩，身体轻靠，展现喜庆氛围。肖像保真：100%还原。新郎发型固定，拒绝眯眯眼。二、造型细节新娘：大红色抹胸蓬蓬裙婚纱，裙摆体积感庞大，层叠细节清晰。白色蕾丝缎带包扎的手捧花置于身前。新郎：黑色双排扣西装，黑色亮面尖头皮鞋。造型干净极致，展现端庄稳重。三、场景与画质场景：中国红幕布，纯净无杂物。画质与光影：整体暖色调。红色呈现正红偏橘。暗部细节丰富，胶片感十足。Negative Prompt: 画面死白, 面部泛油, 模特佝偻, 日本脸, 现代感, 荧光红, 杂乱背景.四、分镜动作Full body shot. The couple standing side-by-side in front of the red curtain. The groom’s arm is naturally around the bride’s waist. Both look into the camera with bright, joyful smiles. Majestic 90s studio composition. --ar 3:4",
        aspectRatio: "3:4",
        scene: "1995港风",
        pose: "D",
        styleTags: ["港风", "1995", "复古", "胶片"]
      },
      {
        name: "E",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（16:9）。1995年港风系列完美收官，结合了拥抱的温馨感与看镜头的互动感。\n\n一、人物绑定（最高优先级）\n\n人物：新郎从身后环抱新娘，新娘微微侧身回头。比例自然，形体挺挺不佝偻。\n\n肖像保真：100%还原。新郎眼神宠溺，新娘笑容灿烂。\n\n二、造型细节\n\n新娘：大红色多层欧根纱头纱自然垂落。大红色婚纱光泽感真实。\n\n新郎：黑色西装，黑色亮面皮鞋。所有饰品（珍珠、胸花）细节闭环。\n\n三、场景与画质\n\n场景：中国红幕布背景。\n\n画质与色调：整体色彩饱和但不刺眼，暖红橙调。4K冲印质感。Negative Prompt: 画面发白, 面部油腻, 模特佝偻, 日本脸特征, 眼睛过小, 现代荧光色, 抠图感.\n\n四、分镜动作\n\nMedium shot. The groom embraces the bride from behind around her waist. The bride tilts her head back to look at the camera, leaning against the groom. Both are smiling warmly. The long red veil frames their happy faces. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（16:9）。1995年港风系列完美收官，结合了拥抱的温馨感与看镜头的互动感。一、人物绑定（最高优先级）人物：新郎从身后环抱新娘，新娘微微侧身回头。比例自然，形体挺挺不佝偻。肖像保真：100%还原。新郎眼神宠溺，新娘笑容灿烂。二、造型细节新娘：大红色多层欧根纱头纱自然垂落。大红色婚纱光泽感真实。新郎：黑色西装，黑色亮面皮鞋。所有饰品（珍珠、胸花）细节闭环。三、场景与画质场景：中国红幕布背景。画质与色调：整体色彩饱和但不刺眼，暖红橙调。4K冲印质感。Negative Prompt: 画面发白, 面部油腻, 模特佝偻, 日本脸特征, 眼睛过小, 现代荧光色, 抠图感.四、分镜动作Medium shot. The groom embraces the bride from behind around her waist. The bride tilts her head back to look at the camera, leaning against the groom. Both are smiling warmly. The long red veil frames their happy faces. --ar 3:4",
        aspectRatio: "3:4",
        scene: "1995港风",
        pose: "E",
        styleTags: ["港风", "1995", "复古", "胶片"]
      }
    ]
  }),
  makeTheme({
    themeId: "waterside",
    themeName: "水边",
    themeDescription: "湖畔、水边、微风与倒影，整体轻盈、清透、自然。",
    suitableFor: "适合喜欢户外清透、温柔自然、带一点旅拍感的用户。",
    defaultAspectRatio: "4:5",
    coverImage: "/demo/themes/waterside/cover-1.jpg",
    coverImages: ["/demo/themes/waterside/cover-1.jpg", "/demo/themes/waterside/cover-2.jpg", "/demo/themes/waterside/cover-3.jpg", "/demo/themes/waterside/cover-4.jpg", "/demo/themes/waterside/cover-5.jpg"],
    galleryImages: ["/demo/themes/waterside/1.jpg", "/demo/themes/waterside/2.jpg", "/demo/themes/waterside/3.jpg", "/demo/themes/waterside/4.jpg", "/demo/themes/waterside/5.jpg"],
    prompts: [
      {
        name: "A",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：生成超高清竖构图（3:4）韩式海景婚纱摄影作品。风格为冷蓝色调、电影质感。背景为波光粼粼的蔚蓝海面。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用您上传的肖像。男性为唯一新郎，女性为唯一新娘。每张图为双人照或新娘单人照。\n\n肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。\n\n身材比例：男性身高约180cm，身形挺拔；女性身形修长。双人同框时，男性明显高于女性（15-20cm），比例自然。\n\n二、造型细节\n\n新娘：黑色直发，韩式低盘发，留有碎发丝。妆容为清透奶油肌，自然野生眉，正红色丝绒唇。身着抹胸心形领口鱼尾婚纱，通体点缀立体小花、珠片刺绣。佩戴超长飘逸头纱（2-3米），上有稀疏立体花、珍珠装饰。可选珍珠耳饰与薄纱长手套。\n\n新郎：黑色短发，纹理感造型。妆容干净自然。身着深灰色修身羊毛质感西装套装，白衬衫，深色领带，黑色皮鞋。\n\n三、场景与画质\n\n背景：开阔海面，海水清透蓝绿色。阳光洒落形成密集、梦幻的圆形光斑（bokeh）。前景为自然礁石或鹅卵石滩。\n\n光影：黄金时段逆光/侧逆光，人物有柔和轮廓光。面部补光均匀。\n\n色调：整体冷蓝色调，清透高级。肤色白皙带冷调粉感。\n\n画质：超高清，保留皮肤纹理、婚纱蕾丝与珠片细节。景深自然，背景虚化柔和。\n\n禁止：任何现代建筑、杂物、浑浊海水、暖黄暗沉色调、过度磨皮、AI假笑**k5％。\n\n四、分镜动作\n\n背后相依：新郎从后环抱新娘，脸颊相贴。新娘双手覆于新郎手上，温柔看向镜头。亲密半身照。",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：生成超高清竖构图（3:4）韩式海景婚纱摄影作品。风格为冷蓝色调、电影质感。背景为波光粼粼的蔚蓝海面。一、人物绑定（最高优先级）人物：严格使用您上传的肖像。男性为唯一新郎，女性为唯一新娘。每张图为双人照或新娘单人照。肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。身材比例：男性身高约180cm，身形挺拔；女性身形修长。双人同框时，男性明显高于女性（15-20cm），比例自然。二、造型细节新娘：黑色直发，韩式低盘发，留有碎发丝。妆容为清透奶油肌，自然野生眉，正红色丝绒唇。身着抹胸心形领口鱼尾婚纱，通体点缀立体小花、珠片刺绣。佩戴超长飘逸头纱（2-3米），上有稀疏立体花、珍珠装饰。可选珍珠耳饰与薄纱长手套。新郎：黑色短发，纹理感造型。妆容干净自然。身着深灰色修身羊毛质感西装套装，白衬衫，深色领带，黑色皮鞋。三、场景与画质背景：开阔海面，海水清透蓝绿色。阳光洒落形成密集、梦幻的圆形光斑（bokeh）。前景为自然礁石或鹅卵石滩。光影：黄金时段逆光/侧逆光，人物有柔和轮廓光。面部补光均匀。色调：整体冷蓝色调，清透高级。肤色白皙带冷调粉感。画质：超高清，保留皮肤纹理、婚纱蕾丝与珠片细节。景深自然，背景虚化柔和。禁止：任何现代建筑、杂物、浑浊海水、暖黄暗沉色调、过度磨皮、AI假笑**k5％。四、分镜动作背后相依：新郎从后环抱新娘，脸颊相贴。新娘双手覆于新郎手上，温柔看向镜头。亲密半身照。",
        aspectRatio: "3:4",
        scene: "水边",
        pose: "A",
        styleTags: ["水边", "倒影", "清透", "自然"]
      },
      {
        name: "B",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：生成超高清横构图（16:9）韩式海景婚纱摄影作品。风格为冷蓝色调、电影质感。背景为波光粼粼的蔚蓝海面。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用您上传的肖像。男性为唯一新郎，女性为唯一新娘。每张图为双人照或新娘单人照。\n\n肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。\n\n身材比例：男性身高约180cm，身形挺拔；女性身形修长。双人同框时，男性明显高于女性（15-20cm），比例自然。\n\n二、造型细节\n\n新娘：黑色直发，韩式低盘发，留有碎发丝。妆容为清透奶油肌，自然野生眉，正红色丝绒唇。身着抹胸心形领口鱼尾婚纱，通体点缀立体小花、珠片刺绣。佩戴超长飘逸头纱（2-3米），上有稀疏立体花、珍珠装饰。可选珍珠耳饰与薄纱长手套。\n\n新郎：黑色短发，纹理感造型。妆容干净自然。身着深灰色修身羊毛质感西装套装，白衬衫，深色领带，黑色皮鞋。\n\n三、场景与画质\n\n背景：开阔海面，海水清透蓝绿色。阳光洒落形成密集、梦幻的圆形光斑（bokeh）。前景为自然礁石或鹅卵石滩。\n\n光影：黄金时段逆光/侧逆光，人物有柔和轮廓光。面部补光均匀。\n\n色调：整体冷蓝色调，清透高级。肤色白皙带冷调粉感。\n\n画质：超高清，保留皮肤纹理、婚纱蕾丝与珠片细节。景深自然，背景虚化柔和。\n\n禁止：任何现代建筑、杂物、浑浊海水、暖黄暗沉色调、过度磨皮、AI假笑**k5％。\n\n四、分镜动作\n\n并肩凝望：新人立于礁石，新郎在后手扶新娘肩头，两人温柔看向镜头。全身照，头纱飘扬。\n\n严格禁止：男生的脸和表情不可像日本人，眼睛不可太小",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：生成超高清横构图（16:9）韩式海景婚纱摄影作品。风格为冷蓝色调、电影质感。背景为波光粼粼的蔚蓝海面。一、人物绑定（最高优先级）人物：严格使用您上传的肖像。男性为唯一新郎，女性为唯一新娘。每张图为双人照或新娘单人照。肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。身材比例：男性身高约180cm，身形挺拔；女性身形修长。双人同框时，男性明显高于女性（15-20cm），比例自然。二、造型细节新娘：黑色直发，韩式低盘发，留有碎发丝。妆容为清透奶油肌，自然野生眉，正红色丝绒唇。身着抹胸心形领口鱼尾婚纱，通体点缀立体小花、珠片刺绣。佩戴超长飘逸头纱（2-3米），上有稀疏立体花、珍珠装饰。可选珍珠耳饰与薄纱长手套。新郎：黑色短发，纹理感造型。妆容干净自然。身着深灰色修身羊毛质感西装套装，白衬衫，深色领带，黑色皮鞋。三、场景与画质背景：开阔海面，海水清透蓝绿色。阳光洒落形成密集、梦幻的圆形光斑（bokeh）。前景为自然礁石或鹅卵石滩。光影：黄金时段逆光/侧逆光，人物有柔和轮廓光。面部补光均匀。色调：整体冷蓝色调，清透高级。肤色白皙带冷调粉感。画质：超高清，保留皮肤纹理、婚纱蕾丝与珠片细节。景深自然，背景虚化柔和。禁止：任何现代建筑、杂物、浑浊海水、暖黄暗沉色调、过度磨皮、AI假笑**k5％。四、分镜动作并肩凝望：新人立于礁石，新郎在后手扶新娘肩头，两人温柔看向镜头。全身照，头纱飘扬。严格禁止：男生的脸和表情不可像日本人，眼睛不可太小",
        aspectRatio: "3:4",
        scene: "水边",
        pose: "B",
        styleTags: ["水边", "倒影", "清透", "自然"]
      },
      {
        name: "C",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。捕捉人物愉悦神态与服饰高级质感（珠片、珍珠、羊毛）。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用上传肖像。神态愉悦幸福。新郎形象需英俊帅气，眼睛大小自然，严禁像日本人。\n\n肖像保真：100%还原。\n\n二、造型细节\n\n新娘：抹胸鱼尾婚纱，珠片在光影下具有微弱闪烁感，薄纱手套质感通透，珍珠耳饰。\n\n新郎：深灰色羊毛西装，纹理清晰，深色领带。整个人物面部呈现高级哑光感。\n\n三、场景与画质\n\n场景：阳光洒落的海面。\n\n光影与画质：冷蓝色调，肤色白皙带冷粉。画面坚决不能过曝。Negative Prompt: shiny forehead, oily face, no overexposure, no slouching shoulders, dull eyes, no Japanese facial features, no small eyes for groom.\n\n四、分镜动作\n\nMedium shot, the groom is playfully whispering to the bride, she is laughing heartily with a radiant expression. The sparkling seawater behind them creates a dreamy bokeh. Their postures are relaxed and upright, showing elegant body curves. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。捕捉人物愉悦神态与服饰高级质感（珠片、珍珠、羊毛）。一、人物绑定（最高优先级）人物：严格使用上传肖像。神态愉悦幸福。新郎形象需英俊帅气，眼睛大小自然，严禁像日本人。肖像保真：100%还原。二、造型细节新娘：抹胸鱼尾婚纱，珠片在光影下具有微弱闪烁感，薄纱手套质感通透，珍珠耳饰。新郎：深灰色羊毛西装，纹理清晰，深色领带。整个人物面部呈现高级哑光感。三、场景与画质场景：阳光洒落的海面。光影与画质：冷蓝色调，肤色白皙带冷粉。画面坚决不能过曝。Negative Prompt: shiny forehead, oily face, no overexposure, no slouching shoulders, dull eyes, no Japanese facial features, no small eyes for groom.四、分镜动作Medium shot, the groom is playfully whispering to the bride, she is laughing heartily with a radiant expression. The sparkling seawater behind them creates a dreamy bokeh. Their postures are relaxed and upright, showing elegant body curves. --ar 3:4",
        aspectRatio: "3:4",
        scene: "水边",
        pose: "C",
        styleTags: ["水边", "倒影", "清透", "自然"]
      },
      {
        name: "D",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：生成超高清横构图（16:9）韩式海景摄影作品。冷蓝色调、电影质感。背景为波光粼粼的蔚蓝海面，画面通透高级。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用您上传的肖像。男性为唯一新郎，女性为唯一新娘。男性身形挺拔（180cm），女性形体优美，肩颈曲线舒展，严禁佝偻。\n\n肖像保真：100%沿用原图五官、脸型、肤色。\n\n二、造型细节\n\n新娘：韩式低盘发留有碎发丝；清透奶油肌，正红色丝绒唇。身着抹胸心形领鱼尾婚纱，点缀立体小花与珠片；佩戴3米超长飘逸头纱，饰有珍珠。戴薄纱长手套，质感半透明。\n\n新郎：黑色纹理短发。身着深灰色修身羊毛西装，白衬衫配深色领带。面部干净，肤色白皙带冷粉感。\n\n三、场景与画质\n\n场景：开阔海面，海水清透。前景为自然礁石。阳光形成梦幻圆形光斑。\n\n画质与负面提示：4K超高清。面部呈现高级温润哑光感（matte skin），严禁油光。动作随意自然，表情随和愉悦。Negative Prompt: no overexposure, no oily skin, no slouching, no Japanese facial features, no small eyes for groom, no modern buildings, no warm yellow tones.\n\n四、分镜动作\n\nFull body shot, the couple standing on a dark reef. The groom stands behind the bride, gently resting his hands on her shoulders. Both are looking into the lens with an amiable, joyful smile. The extra-long veil is fluttering elegantly in the sea breeze. --ar 16:9",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：生成超高清横构图（16:9）韩式海景摄影作品。冷蓝色调、电影质感。背景为波光粼粼的蔚蓝海面，画面通透高级。一、人物绑定（最高优先级）人物：严格使用您上传的肖像。男性为唯一新郎，女性为唯一新娘。男性身形挺拔（180cm），女性形体优美，肩颈曲线舒展，严禁佝偻。肖像保真：100%沿用原图五官、脸型、肤色。二、造型细节新娘：韩式低盘发留有碎发丝；清透奶油肌，正红色丝绒唇。身着抹胸心形领鱼尾婚纱，点缀立体小花与珠片；佩戴3米超长飘逸头纱，饰有珍珠。戴薄纱长手套，质感半透明。新郎：黑色纹理短发。身着深灰色修身羊毛西装，白衬衫配深色领带。面部干净，肤色白皙带冷粉感。三、场景与画质场景：开阔海面，海水清透。前景为自然礁石。阳光形成梦幻圆形光斑。画质与负面提示：4K超高清。面部呈现高级温润哑光感（matte skin），严禁油光。动作随意自然，表情随和愉悦。Negative Prompt: no overexposure, no oily skin, no slouching, no Japanese facial features, no small eyes for groom, no modern buildings, no warm yellow tones.四、分镜动作Full body shot, the couple standing on a dark reef. The groom stands behind the bride, gently resting his hands on her shoulders. Both are looking into the lens with an amiable, joyful smile. The extra-long veil is fluttering elegantly in the sea breeze. --ar 16:9",
        aspectRatio: "16:9",
        scene: "水边",
        pose: "D",
        styleTags: ["水边", "倒影", "清透", "自然"]
      },
      {
        name: "E",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。海景摄影的叙事闭环。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用上传肖像。男性身形笔挺如青松，女性形体舒展优雅。双人比例自然。\n\n肖像保真：100%还原。\n\n二、造型细节\n\n新娘：抹胸鱼尾婚纱，立体小花、珍珠装饰细节逼真。韩式低盘发。\n\n新郎：深灰色羊毛西装，白衬衫。表情随和，眼神清澈有神。\n\n三、场景与画质\n\n场景：蔚蓝海边，极简冷蓝色调。\n\n画质与负面提示：4K电影感。Negative Prompt: 画面死白、面部泛油、模特佝偻、表情木讷、日本脸特征、新郎眼睛过小、背景浑浊。\n\n四、分镜动作\n\nFull body shot from a low perspective, the couple standing facing the endless blue ocean. They are holding hands, looking at the horizon with happy, serene expressions. Their silhouettes are sharp, upright, and graceful against the shimmering sea. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。海景摄影的叙事闭环。一、人物绑定（最高优先级）人物：严格使用上传肖像。男性身形笔挺如青松，女性形体舒展优雅。双人比例自然。肖像保真：100%还原。二、造型细节新娘：抹胸鱼尾婚纱，立体小花、珍珠装饰细节逼真。韩式低盘发。新郎：深灰色羊毛西装，白衬衫。表情随和，眼神清澈有神。三、场景与画质场景：蔚蓝海边，极简冷蓝色调。画质与负面提示：4K电影感。Negative Prompt: 画面死白、面部泛油、模特佝偻、表情木讷、日本脸特征、新郎眼睛过小、背景浑浊。四、分镜动作Full body shot from a low perspective, the couple standing facing the endless blue ocean. They are holding hands, looking at the horizon with happy, serene expressions. Their silhouettes are sharp, upright, and graceful against the shimmering sea. --ar 3:4",
        aspectRatio: "3:4",
        scene: "水边",
        pose: "E",
        styleTags: ["水边", "倒影", "清透", "自然"]
      }
    ]
  }),
  makeTheme({
    themeId: "classic-retro-film",
    themeName: "经典复古胶片风",
    themeDescription: "低饱和胶片、人像棚拍、经典婚纱轮廓，耐看且有年代质感。",
    suitableFor: "适合想要经典、不夸张、越看越耐看的婚纱写真用户。",
    defaultAspectRatio: "3:4",
    coverImage: "/demo/themes/classic-retro-film/cover-1.jpg",
    coverImages: ["/demo/themes/classic-retro-film/cover-1.jpg", "/demo/themes/classic-retro-film/cover-2.jpg", "/demo/themes/classic-retro-film/cover-3.jpg", "/demo/themes/classic-retro-film/cover-4.jpg", "/demo/themes/classic-retro-film/cover-5.jpg"],
    galleryImages: ["/demo/themes/classic-retro-film/1.jpg", "/demo/themes/classic-retro-film/2.jpg", "/demo/themes/classic-retro-film/3.jpg", "/demo/themes/classic-retro-film/4.jpg", "/demo/themes/classic-retro-film/5.jpg"],
    prompts: [
      {
        name: "A",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。柯达胶片质感（Kodak Portra 400），暖黄色调。画面带有轻微的颗粒感和高光溢出。背景为郁郁葱葱的深绿色树林。光影呈现出午后阳光穿过叶缝的斑驳感，色调浓郁且具有怀旧叙事性。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用您上传的肖像。男性为新郎，女性为新娘。双人同框，男性明显高于女性（15-20cm），比例自然。\n\n肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。\n\n二、造型细节\n\n新娘：穿戴象牙色重工蕾丝长袖婚纱，带有法式拉夫领细节；发型为复古水波纹卷发，佩戴珍珠耳环；妆容强调哑光质感与红棕色调唇膏。\n\n新郎：穿着棕褐色粗花呢三件套西装，内搭浅米色衬衫，佩戴深咖啡色领结；发型为经典的侧分油头，呈现复古英伦绅士感。\n\n三、场景与画质\n\n背景：深绿色森林边缘，木质长椅带有磨损痕迹。光影：丁达尔效应，斑驳光影。色调：柯达暖黄色调。画质：35mm胶片扫描感，高光处轻微红晕。\n\n四、分镜动作\n\nFull body shot, the couple sits on a weathered wooden bench, the groom looking at the bride tenderly, a vintage beige suitcase at their feet. Warm film grain, nostalgic mood. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。柯达胶片质感（Kodak Portra 400），暖黄色调。画面带有轻微的颗粒感和高光溢出。背景为郁郁葱葱的深绿色树林。光影呈现出午后阳光穿过叶缝的斑驳感，色调浓郁且具有怀旧叙事性。一、人物绑定（最高优先级）人物：严格使用您上传的肖像。男性为新郎，女性为新娘。双人同框，男性明显高于女性（15-20cm），比例自然。肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。二、造型细节新娘：穿戴象牙色重工蕾丝长袖婚纱，带有法式拉夫领细节；发型为复古水波纹卷发，佩戴珍珠耳环；妆容强调哑光质感与红棕色调唇膏。新郎：穿着棕褐色粗花呢三件套西装，内搭浅米色衬衫，佩戴深咖啡色领结；发型为经典的侧分油头，呈现复古英伦绅士感。三、场景与画质背景：深绿色森林边缘，木质长椅带有磨损痕迹。光影：丁达尔效应，斑驳光影。色调：柯达暖黄色调。画质：35mm胶片扫描感，高光处轻微红晕。四、分镜动作Full body shot, the couple sits on a weathered wooden bench, the groom looking at the bride tenderly, a vintage beige suitcase at their feet. Warm film grain, nostalgic mood. --ar 3:4",
        aspectRatio: "3:4",
        scene: "经典复古胶片风",
        pose: "A",
        styleTags: ["复古", "胶片", "经典", "棚拍"]
      },
      {
        name: "B",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：电影宽银幕（16:9）。浓郁电影色彩，高饱和度对比。背景为郁郁葱葱的深绿色树林。画面充满剧情感。\n\n二、造型细节（保持统一）\n\n新娘： 象牙色重工蕾丝长袖婚纱，复古水波纹卷发，珍珠耳环；红棕色调唇膏。\n\n新郎： 棕褐色粗花呢三件套西装，深咖啡色领结，侧分油头。\n\n三、场景与画质\n\n背景：森林边缘，复古长椅与行李箱。光影：对比强烈的丁达尔光影。色调：复古怀旧。画质：4K电影胶片质感，阴影深邃。\n\n四、分镜动作\n\nMedium cinematic shot, the bride's hands are gently adjusting the groom's coffee-colored bowtie. They are standing near the vintage suitcase. Intimate atmosphere, soft focus background, rich vintage tones. --ar 16:9",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：电影宽银幕（16:9）。浓郁电影色彩，高饱和度对比。背景为郁郁葱葱的深绿色树林。画面充满剧情感。二、造型细节（保持统一）新娘： 象牙色重工蕾丝长袖婚纱，复古水波纹卷发，珍珠耳环；红棕色调唇膏。新郎： 棕褐色粗花呢三件套西装，深咖啡色领结，侧分油头。三、场景与画质背景：森林边缘，复古长椅与行李箱。光影：对比强烈的丁达尔光影。色调：复古怀旧。画质：4K电影胶片质感，阴影深邃。四、分镜动作Medium cinematic shot, the bride's hands are gently adjusting the groom's coffee-colored bowtie. They are standing near the vintage suitcase. Intimate atmosphere, soft focus background, rich vintage tones. --ar 16:9",
        aspectRatio: "16:9",
        scene: "经典复古胶片风",
        pose: "B",
        styleTags: ["复古", "胶片", "经典", "棚拍"]
      },
      {
        name: "C",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。捕捉复古时尚画报质感，强调婚纱细节与新娘楚楚动人的神态。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用上传肖像。视觉重心为新娘，新郎作为温柔守护的背景。新娘姿态挺拔，展现优美颈部曲线，严禁缩脖或耸肩。\n\n肖像保真：100%还原。新娘神态端庄自信，眼神明亮。新郎身形直立不佝偻。\n\n二、造型细节\n\n新娘：象牙色重工蕾丝长袖婚纱，拉夫领褶皱清晰逼真。复古水波纹卷发纹理柔顺。妆容通透哑光。\n\n新郎：粗花呢西装面料纤维清晰，展现高端羊毛材质质感。发型整洁。\n\n三、场景与画质\n\n场景：郁郁葱葱的林间，光线穿透树叶。\n\n光影与画质：侧逆光勾勒轮廓，丁达尔效应明显。皮肤呈现高级哑光感，杜绝刺眼油光。Negative Prompt: shiny forehead, oily skin, no slouching, modern aesthetic, messy hair, low quality, vibrant digital colors, bad anatomy.\n\n四、分镜动作\n\nMedium shot. The bride stands elegantly, rays of sunlight hitting her face through the leaves. She smiles confidently at the camera. The groom stands slightly behind her, adjusting his tweed vest. Rich warm tones, high-end editorial mood. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。捕捉复古时尚画报质感，强调婚纱细节与新娘楚楚动人的神态。一、人物绑定（最高优先级）人物：严格使用上传肖像。视觉重心为新娘，新郎作为温柔守护的背景。新娘姿态挺拔，展现优美颈部曲线，严禁缩脖或耸肩。肖像保真：100%还原。新娘神态端庄自信，眼神明亮。新郎身形直立不佝偻。二、造型细节新娘：象牙色重工蕾丝长袖婚纱，拉夫领褶皱清晰逼真。复古水波纹卷发纹理柔顺。妆容通透哑光。新郎：粗花呢西装面料纤维清晰，展现高端羊毛材质质感。发型整洁。三、场景与画质场景：郁郁葱葱的林间，光线穿透树叶。光影与画质：侧逆光勾勒轮廓，丁达尔效应明显。皮肤呈现高级哑光感，杜绝刺眼油光。Negative Prompt: shiny forehead, oily skin, no slouching, modern aesthetic, messy hair, low quality, vibrant digital colors, bad anatomy.四、分镜动作Medium shot. The bride stands elegantly, rays of sunlight hitting her face through the leaves. She smiles confidently at the camera. The groom stands slightly behind her, adjusting his tweed vest. Rich warm tones, high-end editorial mood. --ar 3:4",
        aspectRatio: "3:4",
        scene: "经典复古胶片风",
        pose: "C",
        styleTags: ["复古", "胶片", "经典", "棚拍"]
      },
      {
        name: "D",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。柯达胶片质感（Kodak Portra 400），极具叙事性的暖黄色调。背景为郁郁葱葱的深绿色树林。画面带有轻微颗粒感与高光溢出。光影呈现出午后阳光穿过叶缝的斑驳感。镜头为水平侧45度拍摄\n\n一、人物绑定（最高优先级）\n\n人物：严格使用上传肖像。新郎身高180cm，新娘纤细优雅。双人坐姿端正，身形挺拔。新娘在倚靠时需保持优美身姿，严禁由于放松导致的佝偻或驼背。\n\n肖像保真：100%还原。新郎偏头注视，侧脸轮廓干净英俊；新娘目视前方，眼神温柔坚定。拒绝日本脸，拒绝小眼睛。\n\n二、造型细节\n\n新娘：穿戴象牙色重工蕾丝长袖婚纱，带有法式拉夫领细节。发型为复古水波纹卷发。妆容强调高级哑光感与红棕色调唇膏。佩戴珍珠耳环。\n\n新郎：穿着棕褐色粗花呢三件套西装，内搭浅米色衬衫，佩戴深咖啡色领结。发型为经典侧分油头，呈现复古英伦绅士感。\n\n三、场景与画质\n\n场景：深绿色森林背景，木质长椅带有磨损质感。\n\n光影与画质：丁达尔效应，斑驳光影。肤质呈现高级温润哑光。高光处带有胶片红晕效应（Halation）。Negative Prompt: overexposed, oily skin, plastic skin, slouching, hunchback, modern style, Japanese features, messy posture.\n\n四、分镜动作\n\nFull body shot, the couple is sitting on a weathered wooden bench. The groom is turning his head, looking at the bride with deep affection. The bride gently rests her hand and head on the groom's shoulder, looking straight ahead with a serene smile. Warm film grain, nostalgic narrative mood. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。柯达胶片质感（Kodak Portra 400），极具叙事性的暖黄色调。背景为郁郁葱葱的深绿色树林。画面带有轻微颗粒感与高光溢出。光影呈现出午后阳光穿过叶缝的斑驳感。镜头为水平侧45度拍摄一、人物绑定（最高优先级）人物：严格使用上传肖像。新郎身高180cm，新娘纤细优雅。双人坐姿端正，身形挺拔。新娘在倚靠时需保持优美身姿，严禁由于放松导致的佝偻或驼背。肖像保真：100%还原。新郎偏头注视，侧脸轮廓干净英俊；新娘目视前方，眼神温柔坚定。拒绝日本脸，拒绝小眼睛。二、造型细节新娘：穿戴象牙色重工蕾丝长袖婚纱，带有法式拉夫领细节。发型为复古水波纹卷发。妆容强调高级哑光感与红棕色调唇膏。佩戴珍珠耳环。新郎：穿着棕褐色粗花呢三件套西装，内搭浅米色衬衫，佩戴深咖啡色领结。发型为经典侧分油头，呈现复古英伦绅士感。三、场景与画质场景：深绿色森林背景，木质长椅带有磨损质感。光影与画质：丁达尔效应，斑驳光影。肤质呈现高级温润哑光。高光处带有胶片红晕效应（Halation）。Negative Prompt: overexposed, oily skin, plastic skin, slouching, hunchback, modern style, Japanese features, messy posture.四、分镜动作Full body shot, the couple is sitting on a weathered wooden bench. The groom is turning his head, looking at the bride with deep affection. The bride gently rests her hand and head on the groom's shoulder, looking straight ahead with a serene smile. Warm film grain, nostalgic narrative mood. --ar 3:4",
        aspectRatio: "3:4",
        scene: "经典复古胶片风",
        pose: "D",
        styleTags: ["复古", "胶片", "经典", "棚拍"]
      },
      {
        name: "E",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：电影宽银幕（16:9）。利用全景深（Deep focus）展现森林的纵深跨度。确保前后人物五官、粗花呢西装纹理及蕾丝细节全部清晰锐利，严禁虚焦。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用上传肖像。新郎身形笔挺，180cm挺拔身姿，严禁由于站姿放松导致的佝偻。新娘端庄优雅。两人神态随和，展现出自信且充满张力的互动。\n\n肖像保真：100%还原。新郎形象英俊，眼神聚焦，拒绝眯眯眼，拒绝日本脸特征。\n\n二、造型细节\n\n新娘：象牙色重工蕾丝婚纱，面料细节在全景深下纹理清晰。\n\n新郎：棕褐色粗花呢西装三件套，咖啡色领结。发型质感清晰。\n\n细节：复古提箱作为环境点缀，材质质感真实可见。\n\n三、场景与画质\n\n场景：深绿色茂密森林边缘。\n\n光影与画质：全景深清晰（Deep focus shot），模拟35mm胶片机。柯达暖黄色调，高光溢出感。面部呈现高级温润哑光感，杜绝油光。Negative Prompt: blurred face, out of focus, overexposure, greasy skin, shiny forehead, slouching, Japanese style, small eyes, digital smoothing.\n\n四、分镜动作\n\nCinematic deep focus shot. The bride is in the foreground leaning against a large oak tree, looking back with a radiant smile. The groom stands several meters behind her on the forest path, looking at her with a happy expression. Both figures are in 100% sharp focus against the lush green background. --ar 16:9",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：电影宽银幕（16:9）。利用全景深（Deep focus）展现森林的纵深跨度。确保前后人物五官、粗花呢西装纹理及蕾丝细节全部清晰锐利，严禁虚焦。一、人物绑定（最高优先级）人物：严格使用上传肖像。新郎身形笔挺，180cm挺拔身姿，严禁由于站姿放松导致的佝偻。新娘端庄优雅。两人神态随和，展现出自信且充满张力的互动。肖像保真：100%还原。新郎形象英俊，眼神聚焦，拒绝眯眯眼，拒绝日本脸特征。二、造型细节新娘：象牙色重工蕾丝婚纱，面料细节在全景深下纹理清晰。新郎：棕褐色粗花呢西装三件套，咖啡色领结。发型质感清晰。细节：复古提箱作为环境点缀，材质质感真实可见。三、场景与画质场景：深绿色茂密森林边缘。光影与画质：全景深清晰（Deep focus shot），模拟35mm胶片机。柯达暖黄色调，高光溢出感。面部呈现高级温润哑光感，杜绝油光。Negative Prompt: blurred face, out of focus, overexposure, greasy skin, shiny forehead, slouching, Japanese style, small eyes, digital smoothing.四、分镜动作Cinematic deep focus shot. The bride is in the foreground leaning against a large oak tree, looking back with a radiant smile. The groom stands several meters behind her on the forest path, looking at her with a happy expression. Both figures are in 100% sharp focus against the lush green background. --ar 16:9",
        aspectRatio: "16:9",
        scene: "经典复古胶片风",
        pose: "E",
        styleTags: ["复古", "胶片", "经典", "棚拍"]
      }
    ]
  }),
  makeTheme({
    themeId: "golden-hour-dream",
    themeName: "黄金时刻梦幻风",
    themeDescription: "日落金光、逆光头纱、柔焦与梦幻氛围，整体温暖浪漫。",
    suitableFor: "适合喜欢温暖、梦幻、户外电影感婚纱照的用户。",
    defaultAspectRatio: "4:5",
    coverImage: "/demo/themes/golden-hour-dream/cover-1.jpg",
    coverImages: ["/demo/themes/golden-hour-dream/cover-1.jpg", "/demo/themes/golden-hour-dream/cover-2.jpg", "/demo/themes/golden-hour-dream/cover-3.jpg", "/demo/themes/golden-hour-dream/cover-4.jpg", "/demo/themes/golden-hour-dream/cover-5.jpg"],
    galleryImages: ["/demo/themes/golden-hour-dream/1.jpg", "/demo/themes/golden-hour-dream/2.jpg", "/demo/themes/golden-hour-dream/3.jpg", "/demo/themes/golden-hour-dream/4.jpg", "/demo/themes/golden-hour-dream/5.jpg"],
    prompts: [
      {
        name: "A",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。逆光电影感，暖橙金调。太阳位于地平线边缘，产生强烈的背光效果，新娘的轮廓被金边勾勒。树林背景被虚化成梦幻的光斑（Bokeh），画面温暖、神圣且充满幸福感。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用您上传的肖像。男性为唯一新郎，女性为唯一新娘。每张图为双人照或新娘单人照。\n\n肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。\n\n身材比例：男性身高约180cm，身形挺拔；女性身形修长。双人同框时，男性明显高于女性（15-20cm），比例自然，身型美感严禁佝偻。\n\n二、造型细节\n\n新娘： 大蓬松的一字肩香槟色叠层纱裙，裙摆点缀立体花朵，面料透光质感极强；发型为侧边大波浪编发，点缀具有金属质感的金色发饰；妆容呈现阳光亲吻的温润感。佩戴精致的碎钻项链，质感闪耀。\n\n新郎： 米色西装内搭浅杏色马甲，不带衬衫领带改为佩戴丝绸材质的复古印花丝巾；袖口微微卷起，腕间佩戴具有机械质感的精钢腕表；整体展现出轻松惬意的度假感与温暖气息。\n\n三、场景与画质\n\n场景： 森林背景，植被调低饱和度，排除翠绿色，转为暖咖色。\n\n光影与画质： 逆光电影感。画面坚决不能过曝到丢失细节（no blown-out overexposure），严禁面部油光（matte finish only），表情愉悦随和（joyful and amiable），展现随意的松弛感，严禁佝偻。配件需呈现高奢质感。\n\n四、分镜动作\n\nFull body shot, the couple standing in the center of the glowing forest. The groom is lifting the bride's hand, they are spinning and laughing together. Her dress is glowing with a golden rim light. The vintage suitcase is in the corner. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。逆光电影感，暖橙金调。太阳位于地平线边缘，产生强烈的背光效果，新娘的轮廓被金边勾勒。树林背景被虚化成梦幻的光斑（Bokeh），画面温暖、神圣且充满幸福感。一、人物绑定（最高优先级）人物：严格使用您上传的肖像。男性为唯一新郎，女性为唯一新娘。每张图为双人照或新娘单人照。肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。身材比例：男性身高约180cm，身形挺拔；女性身形修长。双人同框时，男性明显高于女性（15-20cm），比例自然，身型美感严禁佝偻。二、造型细节新娘： 大蓬松的一字肩香槟色叠层纱裙，裙摆点缀立体花朵，面料透光质感极强；发型为侧边大波浪编发，点缀具有金属质感的金色发饰；妆容呈现阳光亲吻的温润感。佩戴精致的碎钻项链，质感闪耀。新郎： 米色西装内搭浅杏色马甲，不带衬衫领带改为佩戴丝绸材质的复古印花丝巾；袖口微微卷起，腕间佩戴具有机械质感的精钢腕表；整体展现出轻松惬意的度假感与温暖气息。三、场景与画质场景： 森林背景，植被调低饱和度，排除翠绿色，转为暖咖色。光影与画质： 逆光电影感。画面坚决不能过曝到丢失细节（no blown-out overexposure），严禁面部油光（matte finish only），表情愉悦随和（joyful and amiable），展现随意的松弛感，严禁佝偻。配件需呈现高奢质感。四、分镜动作Full body shot, the couple standing in the center of the glowing forest. The groom is lifting the bride's hand, they are spinning and laughing together. Her dress is glowing with a golden rim light. The vintage suitcase is in the corner. --ar 3:4",
        aspectRatio: "3:4",
        scene: "黄金时刻梦幻风",
        pose: "A",
        styleTags: ["黄金时刻", "逆光", "梦幻", "户外"]
      },
      {
        name: "B",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。捕捉服饰纹理与人物随和的互动瞬间。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用您上传的肖像。\n\n肖像保真：100%还原。身材比例自然，展现优雅的身体曲线。\n\n二、造型细节\n\n新娘： 香槟色叠层纱裙，侧边大波浪编发，金色发饰。细节：碎钻项链在逆光下具有晶莹的折射感。\n\n新郎： 米色西装，浅杏色马甲，复古印花丝巾，精钢腕表。整体服饰面料细节清晰。\n\n三、场景与画质\n\n场景： 逆光森林，背景虚化。\n\n光影与画质： 侧逆光勾勒人物背部与颈部曲线，强调皮肤温润哑光。Negative Prompt: vibrant green, overexposed skin, oily face, slouching posture, dull eyes. 表情需自然流露出愉悦感。\n\n四、分镜动作\n\nMedium shot, the groom is gently wiping a strand of hair from the bride's face, they are both smiling amiably. The backlighting highlights the intricate lace of the dress and the metallic sheen of the groom's watch. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。捕捉服饰纹理与人物随和的互动瞬间。一、人物绑定（最高优先级）人物：严格使用您上传的肖像。肖像保真：100%还原。身材比例自然，展现优雅的身体曲线。二、造型细节新娘： 香槟色叠层纱裙，侧边大波浪编发，金色发饰。细节：碎钻项链在逆光下具有晶莹的折射感。新郎： 米色西装，浅杏色马甲，复古印花丝巾，精钢腕表。整体服饰面料细节清晰。三、场景与画质场景： 逆光森林，背景虚化。光影与画质： 侧逆光勾勒人物背部与颈部曲线，强调皮肤温润哑光。Negative Prompt: vibrant green, overexposed skin, oily face, slouching posture, dull eyes. 表情需自然流露出愉悦感。四、分镜动作Medium shot, the groom is gently wiping a strand of hair from the bride's face, they are both smiling amiably. The backlighting highlights the intricate lace of the dress and the metallic sheen of the groom's watch. --ar 3:4",
        aspectRatio: "3:4",
        scene: "黄金时刻梦幻风",
        pose: "B",
        styleTags: ["黄金时刻", "逆光", "梦幻", "户外"]
      },
      {
        name: "C",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：电影宽银幕（16:9）。展现随意的生活化电影感。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用您上传的肖像。\n\n肖像保真：100%还原。身材比例自然，男性挺拔，女性优美。\n\n二、造型细节\n\n新娘： 一字肩香槟色叠层纱裙；低饱和度奶茶色妆容。\n\n新郎： 米色西装，浅杏色马甲，袖口微卷，复古丝巾。饰品配件（腕表、丝巾）质感清晰。\n\n三、场景与画质\n\n场景： 消色处理后的暖调草地，行李箱皮质质感清晰，排除翠绿颜色干扰。\n\n光影与画质： 画面色块高度平衡。动作需展现慵懒愉悦（joyful mood），身型展现光影下的曲线，严禁由于紧绷而导致的佝偻。面部无油光，严禁过曝。\n\n四、分镜动作\n\nWide cinematic shot, the couple sitting casually on the grass leaning against the large vintage suitcase. The bride is laughing with her head thrown back, showing her neck curve, the groom is looking at her with a happy smile. Soft golden hour tones. --ar 16:9",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：电影宽银幕（16:9）。展现随意的生活化电影感。一、人物绑定（最高优先级）人物：严格使用您上传的肖像。肖像保真：100%还原。身材比例自然，男性挺拔，女性优美。二、造型细节新娘： 一字肩香槟色叠层纱裙；低饱和度奶茶色妆容。新郎： 米色西装，浅杏色马甲，袖口微卷，复古丝巾。饰品配件（腕表、丝巾）质感清晰。三、场景与画质场景： 消色处理后的暖调草地，行李箱皮质质感清晰，排除翠绿颜色干扰。光影与画质： 画面色块高度平衡。动作需展现慵懒愉悦（joyful mood），身型展现光影下的曲线，严禁由于紧绷而导致的佝偻。面部无油光，严禁过曝。四、分镜动作Wide cinematic shot, the couple sitting casually on the grass leaning against the large vintage suitcase. The bride is laughing with her head thrown back, showing her neck curve, the groom is looking at her with a happy smile. Soft golden hour tones. --ar 16:9",
        aspectRatio: "16:9",
        scene: "黄金时刻梦幻风",
        pose: "C",
        styleTags: ["黄金时刻", "逆光", "梦幻", "户外"]
      },
      {
        name: "D",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：电影宽银幕（16:9）。利用大光圈营造强烈的空间纵深感，体现人物的前后跨度。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用您上传的肖像。男性为唯一新郎，女性为唯一新娘。\n\n肖像保真：100%沿用原图五官。\n\n身材比例：男性身高约180cm，身姿挺拔；女性身形修长。男性明显高于女性，形体美感严禁佝偻。\n\n二、造型细节\n\n新娘： 大蓬松香槟色叠层纱裙，侧边大波浪编发，金色发饰，阳光温润妆容，碎钻项链。\n\n新郎： 米色西装，浅杏色马甲，复古印花丝巾，精钢腕表，袖口卷起，整体身形笔挺。\n\n三、场景与画质\n\n场景： 森林纵深感，太阳光芒从森林深处穿透。前后错位站位。\n\n光影与画质： 大景深梦幻光斑。画面坚决不能过曝（no overexposure），面部温润哑光，杜绝油光。心情愉悦随和，动作随意自然。Negative Prompt: high saturation green, oily face, stiff posture, overexposed highlights, slouching.\n\n四、分镜动作\n\nCinematic depth of field, the bride sits on the dark bench in the foreground, looking back with a bright, joyful smile, slightly out of focus. The groom stands meters behind in sharp focus, tall and erect, leaning against a tree with the suitcase, bathed in warm golden light. --ar 16:9",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：电影宽银幕（16:9）。利用大光圈营造强烈的空间纵深感，体现人物的前后跨度。一、人物绑定（最高优先级）人物：严格使用您上传的肖像。男性为唯一新郎，女性为唯一新娘。肖像保真：100%沿用原图五官。身材比例：男性身高约180cm，身姿挺拔；女性身形修长。男性明显高于女性，形体美感严禁佝偻。二、造型细节新娘： 大蓬松香槟色叠层纱裙，侧边大波浪编发，金色发饰，阳光温润妆容，碎钻项链。新郎： 米色西装，浅杏色马甲，复古印花丝巾，精钢腕表，袖口卷起，整体身形笔挺。三、场景与画质场景： 森林纵深感，太阳光芒从森林深处穿透。前后错位站位。光影与画质： 大景深梦幻光斑。画面坚决不能过曝（no overexposure），面部温润哑光，杜绝油光。心情愉悦随和，动作随意自然。Negative Prompt: high saturation green, oily face, stiff posture, overexposed highlights, slouching.四、分镜动作Cinematic depth of field, the bride sits on the dark bench in the foreground, looking back with a bright, joyful smile, slightly out of focus. The groom stands meters behind in sharp focus, tall and erect, leaning against a tree with the suitcase, bathed in warm golden light. --ar 16:9",
        aspectRatio: "16:9",
        scene: "黄金时刻梦幻风",
        pose: "D",
        styleTags: ["黄金时刻", "逆光", "梦幻", "户外"]
      },
      {
        name: "E",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用您上传的肖像。男性为新郎，女性为新娘。男性身形挺拔，女性身形优雅。双人同框，男性明显高于女性。\n\n肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。\n\n二、造型细节\n\n新娘： 穿戴大蓬松香槟色叠层纱裙，裙摆在微风中轻微摆动；金色发饰具有真实的金属光泽；侧边大波浪编发。\n\n新郎： 穿着米色西装套装，浅杏色马甲，佩戴复古印花丝巾，精钢腕表细节精致；姿态松弛但身形直立。\n\n三、场景与画质\n\n场景： 森林尽头，金色的雾气缭绕（Golden mist）。植被色调沉稳，统一为低饱和度的暖咖色。\n\n光影与画质： 4K电影质感。Negative Prompt: 画面死白、面部泛油、模特佝偻驼背、表情无神木讷、背景过绿、过曝丢失细节。人物表情随和愉快。\n\n四、分镜动作\n\nFull body shot from a side angle, the couple walking slowly into the golden mist of the forest. They are talking and smiling happily. Their silhouettes are sharp, upright, and graceful. Rich golden tones, high-end cinematography. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。一、人物绑定（最高优先级）人物：严格使用您上传的肖像。男性为新郎，女性为新娘。男性身形挺拔，女性身形优雅。双人同框，男性明显高于女性。肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。二、造型细节新娘： 穿戴大蓬松香槟色叠层纱裙，裙摆在微风中轻微摆动；金色发饰具有真实的金属光泽；侧边大波浪编发。新郎： 穿着米色西装套装，浅杏色马甲，佩戴复古印花丝巾，精钢腕表细节精致；姿态松弛但身形直立。三、场景与画质场景： 森林尽头，金色的雾气缭绕（Golden mist）。植被色调沉稳，统一为低饱和度的暖咖色。光影与画质： 4K电影质感。Negative Prompt: 画面死白、面部泛油、模特佝偻驼背、表情无神木讷、背景过绿、过曝丢失细节。人物表情随和愉快。四、分镜动作Full body shot from a side angle, the couple walking slowly into the golden mist of the forest. They are talking and smiling happily. Their silhouettes are sharp, upright, and graceful. Rich golden tones, high-end cinematography. --ar 3:4",
        aspectRatio: "3:4",
        scene: "黄金时刻梦幻风",
        pose: "E",
        styleTags: ["黄金时刻", "逆光", "梦幻", "户外"]
      }
    ]
  }),
  makeTheme({
    themeId: "jiangnan-garden",
    themeName: "江南园林",
    themeDescription: "白墙黛瓦、廊桥水榭、江南园林里的东方婚纱叙事。",
    suitableFor: "适合喜欢中式雅致、含蓄诗意、园林氛围的用户。",
    defaultAspectRatio: "3:4",
    coverImage: "/demo/themes/jiangnan-garden/cover-1.jpg",
    coverImages: ["/demo/themes/jiangnan-garden/cover-1.jpg", "/demo/themes/jiangnan-garden/cover-2.jpg", "/demo/themes/jiangnan-garden/cover-3.jpg", "/demo/themes/jiangnan-garden/cover-4.jpg", "/demo/themes/jiangnan-garden/cover-5.jpg"],
    galleryImages: ["/demo/themes/jiangnan-garden/1.jpg", "/demo/themes/jiangnan-garden/2.jpg", "/demo/themes/jiangnan-garden/3.jpg", "/demo/themes/jiangnan-garden/4.jpg", "/demo/themes/jiangnan-garden/5.jpg"],
    prompts: [
      {
        name: "A",
        prompt: "核心任务：捕捉面部愉悦表情，自动补全珍珠饰品的“珠光” (pearly luster) 与蕾丝面料的立体感 。\n\n一、人物绑定：双人近景互动，形体自然、神态愉悦 。\n\n\n\n\n\n二、造型细节：特写珍珠垂坠耳环的圆润质感，新娘正红色丝绒唇妆，皮肤纹理真实 。\n\n\n\n三、场景与画质：柔和逆光营造氛围，无高光死白，保留细节。超高清画质 。\n\n\n\n四、分镜动作：以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：Medium close-up shot. The groom is gently adjusting the bride's long lace veil from behind. The bride is looking down shyly with a happy smile. Close-up on the pearly luster of her earrings and the intricate 3D floral lace. --ar 3:4\n五：负面提示词：overexposed, oily skin, shiny face, greasy forehead, blown-out highlights, slouching, hunchback, blurred face, out of focus, expressionless, dull eyes, vibrant green background, modern buildings, messy flowers, third person, mirrored faces.",
        rawPrompt: "核心任务：捕捉面部愉悦表情，自动补全珍珠饰品的“珠光” (pearly luster) 与蕾丝面料的立体感 。一、人物绑定：双人近景互动，形体自然、神态愉悦 。二、造型细节：特写珍珠垂坠耳环的圆润质感，新娘正红色丝绒唇妆，皮肤纹理真实 。三、场景与画质：柔和逆光营造氛围，无高光死白，保留细节。超高清画质 。四、分镜动作：以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：Medium close-up shot. The groom is gently adjusting the bride's long lace veil from behind. The bride is looking down shyly with a happy smile. Close-up on the pearly luster of her earrings and the intricate 3D floral lace. --ar 3:4五：负面提示词：overexposed, oily skin, shiny face, greasy forehead, blown-out highlights, slouching, hunchback, blurred face, out of focus, expressionless, dull eyes, vibrant green background, modern buildings, messy flowers, third person, mirrored faces.",
        aspectRatio: "3:4",
        scene: "江南园林",
        pose: "A",
        styleTags: ["江南", "园林", "东方", "诗意"]
      },
      {
        name: "B",
        prompt: "核心任务：超高清竖构图 (3:4)。利用月洞门作为天然画框，展示新娘法式鱼尾婚纱的完整裙摆与新郎挺拔的全身形体 。\n\n\n\n\n\n一、人物绑定：严格使用您上传的肖像，男性身高达 180cm 且明显高于女性，身形挺拔严禁佝偻 。\n\n\n\n\n\n二、造型细节：新娘黑色低位发髻配蕾丝长头纱，身着象牙白鱼尾婚纱；新郎黑色背头配燕尾服礼服 。\n\n\n\n三、场景与画质：江南园林白墙黛瓦，低饱和灰绿调，电影胶片质感。面部哑光，无油光过曝 。\n\n四、分镜动作：以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：Full body shot, a romantic couple standing behind a traditional Chinese Moon Gate. The bride wears an ivory French fishtail lace wedding dress with a heart-shaped neckline and a 50cm trail. Symmetrical composition with white walls and dark wood windows. --ar 3:4\n五：负面提示词：overexposed, oily skin, shiny face, greasy forehead, blown-out highlights, slouching, hunchback, blurred face, out of focus, expressionless, dull eyes, vibrant green background, modern buildings, messy flowers, third person, mirrored faces.",
        rawPrompt: "核心任务：超高清竖构图 (3:4)。利用月洞门作为天然画框，展示新娘法式鱼尾婚纱的完整裙摆与新郎挺拔的全身形体 。一、人物绑定：严格使用您上传的肖像，男性身高达 180cm 且明显高于女性，身形挺拔严禁佝偻 。二、造型细节：新娘黑色低位发髻配蕾丝长头纱，身着象牙白鱼尾婚纱；新郎黑色背头配燕尾服礼服 。三、场景与画质：江南园林白墙黛瓦，低饱和灰绿调，电影胶片质感。面部哑光，无油光过曝 。四、分镜动作：以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：Full body shot, a romantic couple standing behind a traditional Chinese Moon Gate. The bride wears an ivory French fishtail lace wedding dress with a heart-shaped neckline and a 50cm trail. Symmetrical composition with white walls and dark wood windows. --ar 3:4五：负面提示词：overexposed, oily skin, shiny face, greasy forehead, blown-out highlights, slouching, hunchback, blurred face, out of focus, expressionless, dull eyes, vibrant green background, modern buildings, messy flowers, third person, mirrored faces.",
        aspectRatio: "3:4",
        scene: "江南园林",
        pose: "B",
        styleTags: ["江南", "园林", "东方", "诗意"]
      },
      {
        name: "C",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n[cite_start]核心任务：电影宽银幕（16:9）。展现行走在园林深处的电影感，通过侧影叙述宁静雅致的爱情故事 [cite: 59, 72]。\n\n一、人物绑定（最高优先级）\n\n[cite_start]人物：远景中维持形体挺拔，严禁由于动作放松导致的佝偻 [cite: 78, 93]。\n\n[cite_start]肖像保真：100%还原。新郎身高优势明显 [cite: 38, 93]。\n\n二、造型细节\n\n[cite_start]新娘：鱼尾婚纱裙摆自然铺在青石桥面。长头纱在风中轻微飘逸（fluttering slightly），质感轻盈 [cite: 33, 38]。\n\n[cite_start]新郎：黑色燕尾服背影挺拔如松 [cite: 38, 74]。\n\n三、场景与画质\n\n[cite_start]场景：园林石桥，周围环绕古树与湖石假山，低饱和色调处理 [cite: 38, 93]。\n\n[cite_start]光影与画质：电影胶片质感，保留环境层次，画面无过曝死白。面部及外露皮肤均为哑光 [cite: 38, 93]。\n\n四、分镜动作\n\nWide cinematic shot. The couple is standing on a small stone bridge, seen from a distance. They are leaning against each other, looking at the water and rockeries. Peaceful, narrative atmosphere. Texture of weathered stone path is clear. Negative Prompt: overexposed, oily skin, shiny face, greasy forehead, blown-out highlights, slouching, hunchback, blurred face, out of focus, expressionless, dull eyes, vibrant green background. --ar 16:9",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：电影宽银幕（16:9）。展现行走在园林深处的电影感，通过侧影叙述宁静雅致的爱情故事 。一、人物绑定（最高优先级）人物：远景中维持形体挺拔，严禁由于动作放松导致的佝偻 。肖像保真：100%还原。新郎身高优势明显 。二、造型细节新娘：鱼尾婚纱裙摆自然铺在青石桥面。长头纱在风中轻微飘逸（fluttering slightly），质感轻盈 。新郎：黑色燕尾服背影挺拔如松 。三、场景与画质场景：园林石桥，周围环绕古树与湖石假山，低饱和色调处理 。光影与画质：电影胶片质感，保留环境层次，画面无过曝死白。面部及外露皮肤均为哑光 。四、分镜动作Wide cinematic shot. The couple is standing on a small stone bridge, seen from a distance. They are leaning against each other, looking at the water and rockeries. Peaceful, narrative atmosphere. Texture of weathered stone path is clear. Negative Prompt: overexposed, oily skin, shiny face, greasy forehead, blown-out highlights, slouching, hunchback, blurred face, out of focus, expressionless, dull eyes, vibrant green background. --ar 16:9",
        aspectRatio: "16:9",
        scene: "江南园林",
        pose: "C",
        styleTags: ["江南", "园林", "东方", "诗意"]
      },
      {
        name: "D",
        prompt: "核心任务：电影宽银幕 (16:9)。强制全景深 (Deep focus)，展现中式长廊透视纵深，确保前后两人五官均清晰锐利，严禁虚焦 。\n\n\n\n\n\n一、人物绑定：肖像 100% 还原，维持新郎精英气质与新娘高挑比例 。\n\n\n\n\n\n二、造型细节：新娘 2 米蕾丝长头纱拖地，质感清晰；新郎燕尾服展现羊毛纤维纹理 (wool fiber texture) 。\n\n\n\n\n\n三、场景与画质：深色木质雕花长廊，透视感极强。清冷通透色调，面部温润哑光 。\n\n\n\n四、分镜动作：以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：Cinematic deep focus shot in a long wooden corridor with exquisite carved windows. The bride is in the foreground, looking back with a joyful smile, while the groom stands several meters behind. Both faces are 100% sharp and clear with no blurring. Strong spatial depth. --ar 16:9\n五：负面提示词：overexposed, oily skin, shiny face, greasy forehead, blown-out highlights, slouching, hunchback, blurred face, out of focus, expressionless, dull eyes, vibrant green background, modern buildings, messy flowers, third person, mirrored faces.",
        rawPrompt: "核心任务：电影宽银幕 (16:9)。强制全景深 (Deep focus)，展现中式长廊透视纵深，确保前后两人五官均清晰锐利，严禁虚焦 。一、人物绑定：肖像 100% 还原，维持新郎精英气质与新娘高挑比例 。二、造型细节：新娘 2 米蕾丝长头纱拖地，质感清晰；新郎燕尾服展现羊毛纤维纹理 (wool fiber texture) 。三、场景与画质：深色木质雕花长廊，透视感极强。清冷通透色调，面部温润哑光 。四、分镜动作：以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：Cinematic deep focus shot in a long wooden corridor with exquisite carved windows. The bride is in the foreground, looking back with a joyful smile, while the groom stands several meters behind. Both faces are 100% sharp and clear with no blurring. Strong spatial depth. --ar 16:9五：负面提示词：overexposed, oily skin, shiny face, greasy forehead, blown-out highlights, slouching, hunchback, blurred face, out of focus, expressionless, dull eyes, vibrant green background, modern buildings, messy flowers, third person, mirrored faces.",
        aspectRatio: "16:9",
        scene: "江南园林",
        pose: "D",
        styleTags: ["江南", "园林", "东方", "诗意"]
      },
      {
        name: "E",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n[cite_start]核心任务：超高清竖构图（3:4）。描述自然随意的互动动作，体现愉悦心情与江南园林的宁静雅致氛围 [cite: 55, 59, 94]。\n\n一、人物绑定（最高优先级）\n\n[cite_start]人物：严格锁定肖像。双人侧身相对，比例自然 [cite: 38, 39]。\n\n[cite_start]肖像保真：保持100%还原。新娘身形纤细高挑，展现身体曲线美 [cite: 38, 93]。\n\n二、造型细节\n\n[cite_start]新娘：手持极简色调花束。黑色盘发圆润有型，妆容温婉哑光 [cite: 38, 89]。\n\n[cite_start]新郎：黑色西装剪裁挺括（crisp tailoring），细节质感真实 [cite: 72]。\n\n三、场景与画质\n\n场景：中式园林雕花木质花窗（Flower-patterned window）前。\n\n[cite_start]光影与画质：柔和自然光，主色调为低饱和灰灰色，画面宁静高雅 [cite: 38, 93]。\n\n四、分镜动作\n\nThe couple leaning casually against a traditional flower-patterned window. The bride is laughing softly, the groom whispers in her ear while holding her hand. Spontaneous happy moment, elegant postures. Negative Prompt: overexposed, oily skin, shiny face, greasy forehead, blown-out highlights, slouching, hunchback, blurred face, out of focus, expressionless, dull eyes, vibrant green background. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。描述自然随意的互动动作，体现愉悦心情与江南园林的宁静雅致氛围 。一、人物绑定（最高优先级）人物：严格锁定肖像。双人侧身相对，比例自然 。肖像保真：保持100%还原。新娘身形纤细高挑，展现身体曲线美 。二、造型细节新娘：手持极简色调花束。黑色盘发圆润有型，妆容温婉哑光 。新郎：黑色西装剪裁挺括（crisp tailoring），细节质感真实 。三、场景与画质场景：中式园林雕花木质花窗（Flower-patterned window）前。光影与画质：柔和自然光，主色调为低饱和灰灰色，画面宁静高雅 。四、分镜动作The couple leaning casually against a traditional flower-patterned window. The bride is laughing softly, the groom whispers in her ear while holding her hand. Spontaneous happy moment, elegant postures. Negative Prompt: overexposed, oily skin, shiny face, greasy forehead, blown-out highlights, slouching, hunchback, blurred face, out of focus, expressionless, dull eyes, vibrant green background. --ar 3:4",
        aspectRatio: "3:4",
        scene: "江南园林",
        pose: "E",
        styleTags: ["江南", "园林", "东方", "诗意"]
      }
    ]
  }),
  makeTheme({
    themeId: "castle-editorial-escape",
    themeName: "古堡画报·时尚逃离",
    themeDescription: "欧式古堡、画报构图、时装化婚纱，像一场高级逃离。",
    suitableFor: "适合喜欢大片感、建筑感、高级画报风的用户。",
    defaultAspectRatio: "4:5",
    coverImage: "/demo/themes/castle-editorial-escape/cover-1.jpg",
    coverImages: ["/demo/themes/castle-editorial-escape/cover-1.jpg", "/demo/themes/castle-editorial-escape/cover-2.jpg", "/demo/themes/castle-editorial-escape/cover-3.jpg", "/demo/themes/castle-editorial-escape/cover-4.jpg", "/demo/themes/castle-editorial-escape/cover-5.jpg"],
    galleryImages: ["/demo/themes/castle-editorial-escape/1.jpg", "/demo/themes/castle-editorial-escape/2.jpg", "/demo/themes/castle-editorial-escape/3.jpg", "/demo/themes/castle-editorial-escape/4.jpg", "/demo/themes/castle-editorial-escape/5.jpg"],
    prompts: [
      {
        name: "A",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。复古古堡风（Gothic Castle Aesthetic）结合时尚画报质感。中心构图，以女生为核心。冷咖色与米色的高级色调，保留细腻的颗粒感与画报杂志的精致纹理。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用您上传的肖像。女性为核心（酷飒放松），男性为背景（沉稳放松）。男性身形挺拔直立（180cm），女性形体修长优雅。双人同框比例自然，严禁佝偻，严禁由于动作放松导致的驼背。\n\n肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。新郎眼神需英俊深邃，严禁小眼睛或日本脸特征。\n\n二、造型细节\n\n新娘：黑色长发盘发，妆容为浓艳红唇配精致眼妆；戴黑色墨镜，神情酷飒。身着白色抹胸蕾丝鱼尾婚纱，佩戴长款通透头纱与蕾丝手套。形体展现极佳的曲线感。\n\n新郎：黑色长发，纹理分明；妆容清透自然；戴黑色墨镜。身着白色西装外套、黑色西裤配领结，展现出时尚且沉稳的绅士气质。\n\n三、场景与画质\n\n场景：复古古堡庭院，含木门、石墙与消色处理后的绿植。一台米色车辆停在中央，车身漆面质感清晰。\n\n光影与画质：柔和自然光，面部补光均匀，呈现温润哑光感。主体对焦清晰，画面质感细腻。Negative Prompt: no overexposure, no oily skin, no shiny forehead, no slouching, no hunchback, no Japanese facial features, no small eyes, no vibrant green.\n\n四、分镜动作\n\nFull body shot, centered on the bride. The bride is leaning coolly against the beige car body, one hand touching her head, red lips slightly curled in a confident smile. The groom stands in the background with hands in pockets, looking steady and relaxed. Cinematic editorial style. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。复古古堡风（Gothic Castle Aesthetic）结合时尚画报质感。中心构图，以女生为核心。冷咖色与米色的高级色调，保留细腻的颗粒感与画报杂志的精致纹理。一、人物绑定（最高优先级）人物：严格使用您上传的肖像。女性为核心（酷飒放松），男性为背景（沉稳放松）。男性身形挺拔直立（180cm），女性形体修长优雅。双人同框比例自然，严禁佝偻，严禁由于动作放松导致的驼背。肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。新郎眼神需英俊深邃，严禁小眼睛或日本脸特征。二、造型细节新娘：黑色长发盘发，妆容为浓艳红唇配精致眼妆；戴黑色墨镜，神情酷飒。身着白色抹胸蕾丝鱼尾婚纱，佩戴长款通透头纱与蕾丝手套。形体展现极佳的曲线感。新郎：黑色长发，纹理分明；妆容清透自然；戴黑色墨镜。身着白色西装外套、黑色西裤配领结，展现出时尚且沉稳的绅士气质。三、场景与画质场景：复古古堡庭院，含木门、石墙与消色处理后的绿植。一台米色车辆停在中央，车身漆面质感清晰。光影与画质：柔和自然光，面部补光均匀，呈现温润哑光感。主体对焦清晰，画面质感细腻。Negative Prompt: no overexposure, no oily skin, no shiny forehead, no slouching, no hunchback, no Japanese facial features, no small eyes, no vibrant green.四、分镜动作Full body shot, centered on the bride. The bride is leaning coolly against the beige car body, one hand touching her head, red lips slightly curled in a confident smile. The groom stands in the background with hands in pockets, looking steady and relaxed. Cinematic editorial style. --ar 3:4",
        aspectRatio: "3:4",
        scene: "古堡画报·时尚逃离",
        pose: "A",
        styleTags: ["古堡", "画报", "时尚", "建筑感"]
      },
      {
        name: "B",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：电影宽银幕（16:9）。利用全景深（Deep focus）展现古堡庭院与车辆的前后纵深跨度。前后人物五官及墨镜质感必须全部清晰，严禁虚焦。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用上传肖像。新娘表情酷飒放松，新郎沉稳。形体美感保持直立，严禁佝偻。\n\n肖像保真：100%还原。新郎形象需帅气英俊，拒绝眯眯眼，拒绝日本脸特征。\n\n二、造型细节\n\n新娘：白色蕾丝鱼尾婚纱，长款头纱飞舞，蕾丝手套细节清晰，浓艳红唇，戴黑色墨镜。\n\n新郎：白色西装外套配黑西裤，黑色长发，戴黑色墨镜。整体服饰剪裁挺括，羊毛质感分明。\n\n三、场景与画质\n\n场景：古堡石墙延伸线与米色车辆。利用透视关系，新娘在前景靠车，新郎在后方背景处。\n\n光影与画质：全景深清晰（Deep focus shot），所有人五官及服饰纹理锐利。面部温润哑光，杜绝油光。Negative Prompt: blurred face, out of focus, overexposed highlights, greasy skin, no hunchback, no expressionless face, no small eyes for groom.\n\n四、分镜动作\n\nCinematic deep focus shot, the bride is in the foreground leaning against the front of the beige car, looking coolly into the lens through her sunglasses. The groom stands several meters behind by the castle's heavy wooden door, also in sharp focus, looking steady. Strong spatial depth. --ar 16:9",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：电影宽银幕（16:9）。利用全景深（Deep focus）展现古堡庭院与车辆的前后纵深跨度。前后人物五官及墨镜质感必须全部清晰，严禁虚焦。一、人物绑定（最高优先级）人物：严格使用上传肖像。新娘表情酷飒放松，新郎沉稳。形体美感保持直立，严禁佝偻。肖像保真：100%还原。新郎形象需帅气英俊，拒绝眯眯眼，拒绝日本脸特征。二、造型细节新娘：白色蕾丝鱼尾婚纱，长款头纱飞舞，蕾丝手套细节清晰，浓艳红唇，戴黑色墨镜。新郎：白色西装外套配黑西裤，黑色长发，戴黑色墨镜。整体服饰剪裁挺括，羊毛质感分明。三、场景与画质场景：古堡石墙延伸线与米色车辆。利用透视关系，新娘在前景靠车，新郎在后方背景处。光影与画质：全景深清晰（Deep focus shot），所有人五官及服饰纹理锐利。面部温润哑光，杜绝油光。Negative Prompt: blurred face, out of focus, overexposed highlights, greasy skin, no hunchback, no expressionless face, no small eyes for groom.四、分镜动作Cinematic deep focus shot, the bride is in the foreground leaning against the front of the beige car, looking coolly into the lens through her sunglasses. The groom stands several meters behind by the castle's heavy wooden door, also in sharp focus, looking steady. Strong spatial depth. --ar 16:9",
        aspectRatio: "16:9",
        scene: "古堡画报·时尚逃离",
        pose: "B",
        styleTags: ["古堡", "画报", "时尚", "建筑感"]
      },
      {
        name: "C",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：电影宽银幕（16:9）。展现随意的互动瞬间，强调时尚大片的叙事张力与光影对比。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用上传肖像。男性身形挺拔直立，女性形体展现S形曲线。模特动作随性放松，严禁由于动作设计导致的佝偻。\n\n肖像保真：100%还原原图。新郎面部轮廓清晰，拒绝小眼睛。\n\n二、造型细节\n\n新娘：白色抹胸婚纱搭配长款头纱在风中轻盈摆动。墨镜与蕾丝手套增加时尚度。\n\n新郎：白色西装外套与黑色西裤形成的撞色搭配。动作沉稳，手插裤袋。\n\n三、场景与画质\n\n场景：古堡庭院、米色车辆。非对称构图。\n\n画质：质感细腻，写实逼真。面部无油光，杜绝死白过曝。Negative Prompt: overexposed highlights, greasy skin, hunchback, no Japanese style, no small eyes for groom, no blurred face.\n\n四、分镜动作\n\nWide cinematic shot, the couple standing by the beige vintage car in the castle courtyard. The bride is adjusting her veil with a joyful yet cool expression, the groom is leaning back against the car door, smiling amiably. Soft natural light, high-end editorial mood. --ar 16:9",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：电影宽银幕（16:9）。展现随意的互动瞬间，强调时尚大片的叙事张力与光影对比。一、人物绑定（最高优先级）人物：严格使用上传肖像。男性身形挺拔直立，女性形体展现S形曲线。模特动作随性放松，严禁由于动作设计导致的佝偻。肖像保真：100%还原原图。新郎面部轮廓清晰，拒绝小眼睛。二、造型细节新娘：白色抹胸婚纱搭配长款头纱在风中轻盈摆动。墨镜与蕾丝手套增加时尚度。新郎：白色西装外套与黑色西裤形成的撞色搭配。动作沉稳，手插裤袋。三、场景与画质场景：古堡庭院、米色车辆。非对称构图。画质：质感细腻，写实逼真。面部无油光，杜绝死白过曝。Negative Prompt: overexposed highlights, greasy skin, hunchback, no Japanese style, no small eyes for groom, no blurred face.四、分镜动作Wide cinematic shot, the couple standing by the beige vintage car in the castle courtyard. The bride is adjusting her veil with a joyful yet cool expression, the groom is leaning back against the car door, smiling amiably. Soft natural light, high-end editorial mood. --ar 16:9",
        aspectRatio: "16:9",
        scene: "古堡画报·时尚逃离",
        pose: "C",
        styleTags: ["古堡", "画报", "时尚", "建筑感"]
      },
      {
        name: "D",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。专业人像摄影，捕捉酷飒表情与高质感妆容细节。强调时尚画报的冲击力。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用上传肖像。新娘为视觉重心。表情红唇微扬，神态放松且极具张力。\n\n肖像保真：100%还原。新郎作为侧影陪衬，保持笔挺身姿。\n\n二、造型细节\n\n新娘：鱼尾婚纱的蕾丝纹理、蕾丝手套的网格、珍珠配饰的珠光均需清晰逼真。浓艳红唇质感丝绒。\n\n新郎：白色西装面料细节可见，领结端正。墨镜反射出古堡庭院的微弱光影。\n\n三、场景与画质\n\n场景：古堡装饰桌椅旁。\n\n光影与画质：柔和自然光，面部皮肤呈现高级哑光温润感。画面坚决不能过曝，严禁油光。Negative Prompt: shiny forehead, oily face, no overexposure, no slouching, no expressionless face, no Japanese style, no small eyes.\n\n四、分镜动作\n\nMedium shot, the bride is leaning elegantly against the decorated table, looking into the lens with a confident, chic expression, sunglasses pushed down slightly. The groom stands nearby, looking towards her with a steady gaze. High-end fashion texture. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。专业人像摄影，捕捉酷飒表情与高质感妆容细节。强调时尚画报的冲击力。一、人物绑定（最高优先级）人物：严格使用上传肖像。新娘为视觉重心。表情红唇微扬，神态放松且极具张力。肖像保真：100%还原。新郎作为侧影陪衬，保持笔挺身姿。二、造型细节新娘：鱼尾婚纱的蕾丝纹理、蕾丝手套的网格、珍珠配饰的珠光均需清晰逼真。浓艳红唇质感丝绒。新郎：白色西装面料细节可见，领结端正。墨镜反射出古堡庭院的微弱光影。三、场景与画质场景：古堡装饰桌椅旁。光影与画质：柔和自然光，面部皮肤呈现高级哑光温润感。画面坚决不能过曝，严禁油光。Negative Prompt: shiny forehead, oily face, no overexposure, no slouching, no expressionless face, no Japanese style, no small eyes.四、分镜动作Medium shot, the bride is leaning elegantly against the decorated table, looking into the lens with a confident, chic expression, sunglasses pushed down slightly. The groom stands nearby, looking towards her with a steady gaze. High-end fashion texture. --ar 3:4",
        aspectRatio: "3:4",
        scene: "古堡画报·时尚逃离",
        pose: "D",
        styleTags: ["古堡", "画报", "时尚", "建筑感"]
      },
      {
        name: "E",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。古堡纪实叙事感终曲，电影质感。展现行走间的形体美与酷飒心情。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用您上传的肖像。男性身形笔挺如青松，女性形体优雅舒展。\n\n肖像保真：100%沿用原图五官、肤色，禁止修改。\n\n二、造型细节\n\n新娘：白色蕾丝鱼尾婚纱，头纱在身后拖行；蕾丝手套、墨镜、红唇细节精致。\n\n新郎：白色西装领结，黑色短发，身姿笔挺展现时尚力度。\n\n三、场景与画质\n\n场景：古堡木门与石墙。\n\n光影与画质：4K电影感，画面光影平衡，严禁过曝。模特皮肤温润哑光，严禁泛油。Negative Prompt: 画面死白、面部泛油、模特佝偻、表情木讷、日本脸特征、新郎眼睛过小、背景过绿。\n\n四、分镜动作\n\nFull body shot from a low perspective, the couple walking slowly away from the beige car towards the castle gate. The bride looks back coolly, the groom walks beside her with confidence. Their silhouettes are sharp, upright, and graceful. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。古堡纪实叙事感终曲，电影质感。展现行走间的形体美与酷飒心情。一、人物绑定（最高优先级）人物：严格使用您上传的肖像。男性身形笔挺如青松，女性形体优雅舒展。肖像保真：100%沿用原图五官、肤色，禁止修改。二、造型细节新娘：白色蕾丝鱼尾婚纱，头纱在身后拖行；蕾丝手套、墨镜、红唇细节精致。新郎：白色西装领结，黑色短发，身姿笔挺展现时尚力度。三、场景与画质场景：古堡木门与石墙。光影与画质：4K电影感，画面光影平衡，严禁过曝。模特皮肤温润哑光，严禁泛油。Negative Prompt: 画面死白、面部泛油、模特佝偻、表情木讷、日本脸特征、新郎眼睛过小、背景过绿。四、分镜动作Full body shot from a low perspective, the couple walking slowly away from the beige car towards the castle gate. The bride looks back coolly, the groom walks beside her with confidence. Their silhouettes are sharp, upright, and graceful. --ar 3:4",
        aspectRatio: "3:4",
        scene: "古堡画报·时尚逃离",
        pose: "E",
        styleTags: ["古堡", "画报", "时尚", "建筑感"]
      }
    ]
  }),
  makeTheme({
    themeId: "modern-minimal",
    themeName: "现代简约",
    themeDescription: "极简棚拍、现代婚纱剪裁、干净背景和克制高级感。",
    suitableFor: "适合喜欢干净、现代、高级但不过分装饰的用户。",
    defaultAspectRatio: "3:4",
    coverImage: "/demo/themes/modern-minimal/cover-1.jpg",
    coverImages: ["/demo/themes/modern-minimal/cover-1.jpg", "/demo/themes/modern-minimal/cover-2.jpg", "/demo/themes/modern-minimal/cover-3.jpg", "/demo/themes/modern-minimal/cover-4.jpg", "/demo/themes/modern-minimal/cover-5.jpg"],
    galleryImages: ["/demo/themes/modern-minimal/1.jpg", "/demo/themes/modern-minimal/2.jpg", "/demo/themes/modern-minimal/3.jpg", "/demo/themes/modern-minimal/4.jpg", "/demo/themes/modern-minimal/5.jpg"],
    prompts: [
      {
        name: "A",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：电影宽银幕（16:9）。捕捉展示婚戒的幸福瞬间，强调手部与面部神态的自然互动，杜绝僵硬感。画面明亮通透。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用上传肖像。男性挺拔俊朗，眼神聚焦；女性纤细优雅。形体保持挺拔直立，严禁形体佝偻。情绪愉快随和。肖像100%还原。\n\n二、造型细节\n\n新娘：象牙白婚纱，珠片细节。韩式低盘发。\n\n新郎：黑色修身礼服西装。\n\ndetails：新人面向镜头，同时举起佩戴在无名指上的钻石戒指细节（非拼图，真实呈现手部细节，手部结构正确）。\n\n三、场景与画质\n\n场景：极简浅灰色影棚背景。蝴蝶光。\n\n画质与负面提示：面部呈现高级哑光温润感，杜绝油光。婚纱材质有光泽。Negative Prompt: distorted hands, extra fingers, deformed morphology, shiny face, overexposure, bad proportions, Japanese style, small eyes.\n\n四、分镜动作\n\nMedium shot. The couple stands close, smiling happily and naturally at the lens. They are simultaneously holding up their hands to showcase the wedding rings. Clear detail on the diamond rings. Symmetrical and elegant composition. --ar 16:9",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：电影宽银幕（16:9）。捕捉展示婚戒的幸福瞬间，强调手部与面部神态的自然互动，杜绝僵硬感。画面明亮通透。一、人物绑定（最高优先级）人物：严格使用上传肖像。男性挺拔俊朗，眼神聚焦；女性纤细优雅。形体保持挺拔直立，严禁形体佝偻。情绪愉快随和。肖像100%还原。二、造型细节新娘：象牙白婚纱，珠片细节。韩式低盘发。新郎：黑色修身礼服西装。details：新人面向镜头，同时举起佩戴在无名指上的钻石戒指细节（非拼图，真实呈现手部细节，手部结构正确）。三、场景与画质场景：极简浅灰色影棚背景。蝴蝶光。画质与负面提示：面部呈现高级哑光温润感，杜绝油光。婚纱材质有光泽。Negative Prompt: distorted hands, extra fingers, deformed morphology, shiny face, overexposure, bad proportions, Japanese style, small eyes.四、分镜动作Medium shot. The couple stands close, smiling happily and naturally at the lens. They are simultaneously holding up their hands to showcase the wedding rings. Clear detail on the diamond rings. Symmetrical and elegant composition. --ar 16:9",
        aspectRatio: "16:9",
        scene: "现代简约",
        pose: "A",
        styleTags: ["现代", "极简", "白棚", "高级"]
      },
      {
        name: "B",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：电影宽银幕（16:9）。利用全景深（Deep focus）捕捉极近距离的额头相触瞬间，将亲昵与空间感完美融合。所有人五官清晰严禁虚焦。\n\n一、人物绑定（最高优先级）\n\n人物：两人面对面靠近，额头轻轻相触。神态温馨幸福。形体美感严禁驼背或耸肩。严禁由于亲密动作导致的肌肉紧绷或AI畸变。肖像100%还原。新郎英俊非日本脸特征。\n\n二、造型细节\n\ndetails：水钻项链纹理清晰，珍珠发饰圆润光泽，西装礼服材质真实。\n\n三、场景与画质\n\n场景：绝对纯净浅灰白色影棚背景。\n\n画质与负面提示：保留皮肤真实毛孔纹理，面部呈现高级哑光温润感。Negative Prompt: blurred face, out of focus, overexposure, smooth plastic skin, shiny face, bad anatomy, deformed fingers.\n\n四、分镜动作\n\nCinematic deep focus shot. Close-up of the couple's upper chest and faces. Their foreheads are touching gently, looking at each other with affectionate and joyful expressions. Both faces are in sharp focus. Minimalist and romantic mood. --ar 16:9",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：电影宽银幕（16:9）。利用全景深（Deep focus）捕捉极近距离的额头相触瞬间，将亲昵与空间感完美融合。所有人五官清晰严禁虚焦。一、人物绑定（最高优先级）人物：两人面对面靠近，额头轻轻相触。神态温馨幸福。形体美感严禁驼背或耸肩。严禁由于亲密动作导致的肌肉紧绷或AI畸变。肖像100%还原。新郎英俊非日本脸特征。二、造型细节details：水钻项链纹理清晰，珍珠发饰圆润光泽，西装礼服材质真实。三、场景与画质场景：绝对纯净浅灰白色影棚背景。画质与负面提示：保留皮肤真实毛孔纹理，面部呈现高级哑光温润感。Negative Prompt: blurred face, out of focus, overexposure, smooth plastic skin, shiny face, bad anatomy, deformed fingers.四、分镜动作Cinematic deep focus shot. Close-up of the couple's upper chest and faces. Their foreheads are touching gently, looking at each other with affectionate and joyful expressions. Both faces are in sharp focus. Minimalist and romantic mood. --ar 16:9",
        aspectRatio: "16:9",
        scene: "现代简约",
        pose: "B",
        styleTags: ["现代", "极简", "白棚", "高级"]
      },
      {
        name: "C",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。2015年现代简约婚纱摄影。背景为纯净浅灰白影棚。强调精致妆容与配饰细节，画面色调暖白通透。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用上传的肖像。女性为唯一新娘，身形纤细优雅。姿态挺拔端庄，严禁由于近景拍摄导致的缩脖或驼背。情绪温柔优雅。\n\n肖像保真：100%沿用原图五官、脸型、肤色。妆容清透裸肌，淡粉色腮红，气质正红色唇妆。新娘表情自然，眼神清澈。\n\n二、造型细节\n\n新娘：黑色长发，韩式优雅低盘发，留有碎发丝；头戴精致水钻皇冠搭配轻薄白色头纱。身着象牙白一字肩婚纱，通体点缀细密珠片刺绣。配饰为水钻项链，手持白色玫瑰花束于胸前。\n\n三、场景与画质\n\n场景：纯净浅灰白色影棚。\n\n光影与画质：蝴蝶光布光，面部明亮通透，肤质呈现高级哑光感（matte skin），严禁泛油光。超高清画质，背景柔和虚化。Negative Prompt: oily skin, shiny forehead, slouching, bad proportions, cluttered background, vibrant colors, messy hair.\n\n四、分镜动作\n\nChest-up portrait. The bride is holding the white rose bouquet to her chest, looking directly into the lens with a gentle and elegant smile. Intimate focus on makeup and crown details. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。2015年现代简约婚纱摄影。背景为纯净浅灰白影棚。强调精致妆容与配饰细节，画面色调暖白通透。一、人物绑定（最高优先级）人物：严格使用上传的肖像。女性为唯一新娘，身形纤细优雅。姿态挺拔端庄，严禁由于近景拍摄导致的缩脖或驼背。情绪温柔优雅。肖像保真：100%沿用原图五官、脸型、肤色。妆容清透裸肌，淡粉色腮红，气质正红色唇妆。新娘表情自然，眼神清澈。二、造型细节新娘：黑色长发，韩式优雅低盘发，留有碎发丝；头戴精致水钻皇冠搭配轻薄白色头纱。身着象牙白一字肩婚纱，通体点缀细密珠片刺绣。配饰为水钻项链，手持白色玫瑰花束于胸前。三、场景与画质场景：纯净浅灰白色影棚。光影与画质：蝴蝶光布光，面部明亮通透，肤质呈现高级哑光感（matte skin），严禁泛油光。超高清画质，背景柔和虚化。Negative Prompt: oily skin, shiny forehead, slouching, bad proportions, cluttered background, vibrant colors, messy hair.四、分镜动作Chest-up portrait. The bride is holding the white rose bouquet to her chest, looking directly into the lens with a gentle and elegant smile. Intimate focus on makeup and crown details. --ar 3:4",
        aspectRatio: "3:4",
        scene: "现代简约",
        pose: "C",
        styleTags: ["现代", "极简", "白棚", "高级"]
      },
      {
        name: "D",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。展现新郎儒雅绅士、挺拔俊朗的独立肖像。画面强调礼服剪裁与形体美感。\n\n一、人物绑定（最高优先级）\n\n人物：唯一新郎单人。四分之三侧身站姿，形体直立严禁驼背。表情沉稳微笑，眼神看向镜头有神聚焦。\n\n肖像保真：100%还原上传肖像。发型干净利落短发纹理。新郎五官利落英俊，拒绝日本脸。\n\n二、造型细节\n\n新郎：黑色修身礼服西装（材质纤维感纹理清晰），白色衬衫，黑色领结。左胸口袋别白玫瑰胸花。银色婚戒细节清晰。手插裤袋。\n\n三、场景与画质\n\n场景：纯净浅灰白色影棚背景。蝴蝶光。Negative Prompt: overretouch, smooth skin, slouching, gloomy face, dark tones, blurry face, small eyes, Japanese features, wrong suit.\n\n四、分镜动作\n\nMedium shot focusing on the groom. He stands with one hand in his suit pocket, presenting a confident and steady posture. He is looking at the lens with a calm smile. Minimalist background, tailored suit texture. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。展现新郎儒雅绅士、挺拔俊朗的独立肖像。画面强调礼服剪裁与形体美感。一、人物绑定（最高优先级）人物：唯一新郎单人。四分之三侧身站姿，形体直立严禁驼背。表情沉稳微笑，眼神看向镜头有神聚焦。肖像保真：100%还原上传肖像。发型干净利落短发纹理。新郎五官利落英俊，拒绝日本脸。二、造型细节新郎：黑色修身礼服西装（材质纤维感纹理清晰），白色衬衫，黑色领结。左胸口袋别白玫瑰胸花。银色婚戒细节清晰。手插裤袋。三、场景与画质场景：纯净浅灰白色影棚背景。蝴蝶光。Negative Prompt: overretouch, smooth skin, slouching, gloomy face, dark tones, blurry face, small eyes, Japanese features, wrong suit.四、分镜动作Medium shot focusing on the groom. He stands with one hand in his suit pocket, presenting a confident and steady posture. He is looking at the lens with a calm smile. Minimalist background, tailored suit texture. --ar 3:4",
        aspectRatio: "3:4",
        scene: "现代简约",
        pose: "D",
        styleTags: ["现代", "极简", "白棚", "高级"]
      },
      {
        name: "E",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：电影宽银幕（16:9）。利用全景深（Deep focus）在影棚背景下构建空间层次。强调背后环抱的亲密感，确保前后人物五官、婚纱刺绣及西装面料质感全部清晰锐利，严禁虚焦。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用上传肖像。新郎明显高于新娘。姿态挺拔，新郎从身后环抱新娘时脊柱必须保持直立，严禁佝偻或驼背。情绪甜蜜微笑。\n\n肖像保真：100%还原。新郎干净利落短发纹理，眼神聚焦守护，拒绝眯眯眼，拒绝日本脸特征。眼神深棕。\n\n二、造型细节\n\n新娘：象牙白一字肩婚纱，珠片刺绣在全清晰景深下细节分明。韩式低盘发配皇冠。\n\n新郎：黑色修身礼服西装（面料纤维感真实），白色衬衫，黑色领结。\n\n三、场景与画质\n\n场景：纯净浅灰白色影棚背景，大面积极简留白构图。\n\n画质与光影：全景深清晰（Deep focus shot），所有人五官清晰无模糊。面部呈现温润哑光。Negative Prompt: blurred face, out of focus, overexposure, shiny skin, slouching posture, bad proportions, Japanese style.\n\n四、分镜动作\n\nCinematic deep focus shot. The groom embraces the bride gently from behind. They are leaning their cheeks together, both in 100% sharp focus, looking towards the lens with happy smiles. High-end minimalist studio aesthetic. --ar 16:9",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：电影宽银幕（16:9）。利用全景深（Deep focus）在影棚背景下构建空间层次。强调背后环抱的亲密感，确保前后人物五官、婚纱刺绣及西装面料质感全部清晰锐利，严禁虚焦。一、人物绑定（最高优先级）人物：严格使用上传肖像。新郎明显高于新娘。姿态挺拔，新郎从身后环抱新娘时脊柱必须保持直立，严禁佝偻或驼背。情绪甜蜜微笑。肖像保真：100%还原。新郎干净利落短发纹理，眼神聚焦守护，拒绝眯眯眼，拒绝日本脸特征。眼神深棕。二、造型细节新娘：象牙白一字肩婚纱，珠片刺绣在全清晰景深下细节分明。韩式低盘发配皇冠。新郎：黑色修身礼服西装（面料纤维感真实），白色衬衫，黑色领结。三、场景与画质场景：纯净浅灰白色影棚背景，大面积极简留白构图。画质与光影：全景深清晰（Deep focus shot），所有人五官清晰无模糊。面部呈现温润哑光。Negative Prompt: blurred face, out of focus, overexposure, shiny skin, slouching posture, bad proportions, Japanese style.四、分镜动作Cinematic deep focus shot. The groom embraces the bride gently from behind. They are leaning their cheeks together, both in 100% sharp focus, looking towards the lens with happy smiles. High-end minimalist studio aesthetic. --ar 16:9",
        aspectRatio: "16:9",
        scene: "现代简约",
        pose: "E",
        styleTags: ["现代", "极简", "白棚", "高级"]
      }
    ]
  }),
  makeTheme({
    themeId: "chinese-classic-garden",
    themeName: "中式园林",
    themeDescription: "新中式婚纱、园林亭台、东方留白与典雅构图。",
    suitableFor: "适合喜欢传统东方气质、新中式审美和端庄纪念感的用户。",
    defaultAspectRatio: "3:4",
    coverImage: "/demo/themes/chinese-classic-garden/cover-1.jpg",
    coverImages: ["/demo/themes/chinese-classic-garden/cover-1.jpg", "/demo/themes/chinese-classic-garden/cover-2.jpg", "/demo/themes/chinese-classic-garden/cover-3.jpg", "/demo/themes/chinese-classic-garden/cover-4.jpg", "/demo/themes/chinese-classic-garden/cover-5.jpg"],
    galleryImages: ["/demo/themes/chinese-classic-garden/1.jpg", "/demo/themes/chinese-classic-garden/2.jpg", "/demo/themes/chinese-classic-garden/3.jpg", "/demo/themes/chinese-classic-garden/4.jpg", "/demo/themes/chinese-classic-garden/5.jpg"],
    prompts: [
      {
        name: "A",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。怀旧民国风终曲，光线明暗对比强烈，非对称构图。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用您上传的肖像。男性为新郎，女性为新娘。\n\n肖像保真：100%沿用原图五官、肤色，禁止修改。\n\n身材比例：男性身姿挺拔，女性形体舒展优雅。\n\n二、造型细节\n\n新娘： 穿戴白色蕾丝婚纱，花饰头纱质感通透；珍珠配饰呈现金属与珠光的真实光感；黑色复古盘发。\n\n新郎： 穿着笔挺黑西装，黑色复古背头，面如冠玉。动作姿势自然，神态愉悦随和。\n\n三、场景与画质\n\n场景： 园林石拱门，光影错落，环境色调清冷通透。\n\n光影与画质： 4K写实逼真，富士胶片滤镜感。Negative Prompt: 画面死白、过曝、模特油光、皮肤反光严重、模特佝偻、表情木讷。\n\n四、分镜动作\n\nFull body shot from a side angle, the couple walking hand-in-hand through a stone archway. They look happy and free, their postures are straight and noble. The bride’s veil flows slightly behind her. Cinematic composition with a rich nostalgic narrative. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。怀旧民国风终曲，光线明暗对比强烈，非对称构图。一、人物绑定（最高优先级）人物：严格使用您上传的肖像。男性为新郎，女性为新娘。肖像保真：100%沿用原图五官、肤色，禁止修改。身材比例：男性身姿挺拔，女性形体舒展优雅。二、造型细节新娘： 穿戴白色蕾丝婚纱，花饰头纱质感通透；珍珠配饰呈现金属与珠光的真实光感；黑色复古盘发。新郎： 穿着笔挺黑西装，黑色复古背头，面如冠玉。动作姿势自然，神态愉悦随和。三、场景与画质场景： 园林石拱门，光影错落，环境色调清冷通透。光影与画质： 4K写实逼真，富士胶片滤镜感。Negative Prompt: 画面死白、过曝、模特油光、皮肤反光严重、模特佝偻、表情木讷。四、分镜动作Full body shot from a side angle, the couple walking hand-in-hand through a stone archway. They look happy and free, their postures are straight and noble. The bride’s veil flows slightly behind her. Cinematic composition with a rich nostalgic narrative. --ar 3:4",
        aspectRatio: "3:4",
        scene: "中式园林",
        pose: "A",
        styleTags: ["中式园林", "新中式", "亭台", "典雅"]
      },
      {
        name: "B",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：电影宽银幕（16:9）。展现随意自然的互动瞬间，极具回忆感，动作随和且心情愉悦。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用您上传的肖像。男性身高180cm挺拔，女性优美。\n\n肖像保真：100%还原。\n\n二、造型细节\n\n新娘： 白色蕾丝婚纱，花饰头纱，珍珠饰品，复古盘发；新娘表情可爱自然。\n\n新郎： 纯黑西装，精致领结，复古背头。饰品配件（领结、珍珠、花束）质感清晰。\n\n三、场景与画质\n\n场景： 园林中的复古木质长椅与消色植被。\n\n光影与画质： 颗粒感细腻，写实逼真。身型展现光影下的曲线美，动作松弛但挺拔，严禁由于紧绷而导致的佝偻。面部温润哑光，杜绝刺眼油光。Negative Prompt: overexposed highlights, greasy forehead, hunched back, emotionless face, bright green background.\n\n四、分镜动作\n\nWide cinematic shot, the couple sitting casually on the bench with the vintage suitcase beside them. They are sharing a joyful moment, looking at each other and laughing heartily. Their bodies are relaxed but maintain an elegant silhouette. --ar 16:9",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：电影宽银幕（16:9）。展现随意自然的互动瞬间，极具回忆感，动作随和且心情愉悦。一、人物绑定（最高优先级）人物：严格使用您上传的肖像。男性身高180cm挺拔，女性优美。肖像保真：100%还原。二、造型细节新娘： 白色蕾丝婚纱，花饰头纱，珍珠饰品，复古盘发；新娘表情可爱自然。新郎： 纯黑西装，精致领结，复古背头。饰品配件（领结、珍珠、花束）质感清晰。三、场景与画质场景： 园林中的复古木质长椅与消色植被。光影与画质： 颗粒感细腻，写实逼真。身型展现光影下的曲线美，动作松弛但挺拔，严禁由于紧绷而导致的佝偻。面部温润哑光，杜绝刺眼油光。Negative Prompt: overexposed highlights, greasy forehead, hunched back, emotionless face, bright green background.四、分镜动作Wide cinematic shot, the couple sitting casually on the bench with the vintage suitcase beside them. They are sharing a joyful moment, looking at each other and laughing heartily. Their bodies are relaxed but maintain an elegant silhouette. --ar 16:9",
        aspectRatio: "16:9",
        scene: "中式园林",
        pose: "B",
        styleTags: ["中式园林", "新中式", "亭台", "典雅"]
      },
      {
        name: "C",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。采用中近景平视构图，专业人像摄影质感，保留细腻的胶片颗粒感。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用您上传的肖像。\n\n肖像保真：100%还原。身材比例自然，展现优雅的身体曲线，形体美感严禁佝偻。\n\n二、造型细节\n\n新娘： 白色蕾丝婚纱，花饰头纱，珍珠项链细节分明；黑色复古盘发；妆容温婉，脸部呈现温润哑光质感。\n\n新郎： 纯黑西装配精致领结；黑色复古背头，面色如玉，英俊帅气。\n\n三、场景与画质\n\n场景： 暖调光影映衬下的园林角落。\n\n光影与画质： 富士胶卷质感，清透自然。画面坚决不能过曝，面部无油光。人物表情生动自然，情绪随和愉悦。Negative Prompt: no overexposure, no oily skin, no slouching, no expressionless face, no dull eyes.\n\n四、分镜动作\n\nMedium shot, the couple standing close together, their heads touching. The bride holds the floral bouquet close to her face, eyes sparkling with happiness. The groom’s hand rests gently on the bride’s waist, showcasing their elegant postures. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。采用中近景平视构图，专业人像摄影质感，保留细腻的胶片颗粒感。一、人物绑定（最高优先级）人物：严格使用您上传的肖像。肖像保真：100%还原。身材比例自然，展现优雅的身体曲线，形体美感严禁佝偻。二、造型细节新娘： 白色蕾丝婚纱，花饰头纱，珍珠项链细节分明；黑色复古盘发；妆容温婉，脸部呈现温润哑光质感。新郎： 纯黑西装配精致领结；黑色复古背头，面色如玉，英俊帅气。三、场景与画质场景： 暖调光影映衬下的园林角落。光影与画质： 富士胶卷质感，清透自然。画面坚决不能过曝，面部无油光。人物表情生动自然，情绪随和愉悦。Negative Prompt: no overexposure, no oily skin, no slouching, no expressionless face, no dull eyes.四、分镜动作Medium shot, the couple standing close together, their heads touching. The bride holds the floral bouquet close to her face, eyes sparkling with happiness. The groom’s hand rests gently on the bride’s waist, showcasing their elegant postures. --ar 3:4",
        aspectRatio: "3:4",
        scene: "中式园林",
        pose: "C",
        styleTags: ["中式园林", "新中式", "亭台", "典雅"]
      },
      {
        name: "D",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：电影宽银幕（16:9）。利用全景深（Deep focus）展现人物的前后空间跨度，确保前后人物五官均清晰锐利，无虚焦，体现强烈的纵深感。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用您上传的肖像。男性为新郎，女性为新娘。男性身形挺拔，女性身形修长。双人同框，男性明显高于女性，身型严禁佝偻。\n\n肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。\n\n二、造型细节\n\n新娘： 白色蕾丝婚纱搭配精致的花饰头纱，手持花束，珍珠项链质感闪耀；发型为黑色复古盘发；温婉哑光妆容。\n\n新郎： 笔挺纯黑西装配精致领结；黑色复古背头，面部轮廓干净英俊。\n\n三、场景与画质\n\n场景： 园林回廊空间，利用透视关系，新娘在前方，新郎在后方数米远，两人形成纵深跨度。\n\n光影与画质： 全景深清晰画质（Deep focus shot），所有人五官均保持锐利。画面严禁过曝，杜绝面部油光，表情愉悦随和。Negative Prompt: blurred face, out of focus, overexposed highlights, oily forehead, greasy skin, hunchback.\n\n四、分镜动作\n\nCinematic deep focus shot, the bride is in the foreground, turning back to smile cutely at the lens, her face is sharp and clear. The groom stands several meters behind her in the background path, also in sharp focus, looking at her with a happy, playful gaze. Strong spatial depth with full clarity. --ar 16:9",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：电影宽银幕（16:9）。利用全景深（Deep focus）展现人物的前后空间跨度，确保前后人物五官均清晰锐利，无虚焦，体现强烈的纵深感。一、人物绑定（最高优先级）人物：严格使用您上传的肖像。男性为新郎，女性为新娘。男性身形挺拔，女性身形修长。双人同框，男性明显高于女性，身型严禁佝偻。肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。二、造型细节新娘： 白色蕾丝婚纱搭配精致的花饰头纱，手持花束，珍珠项链质感闪耀；发型为黑色复古盘发；温婉哑光妆容。新郎： 笔挺纯黑西装配精致领结；黑色复古背头，面部轮廓干净英俊。三、场景与画质场景： 园林回廊空间，利用透视关系，新娘在前方，新郎在后方数米远，两人形成纵深跨度。光影与画质： 全景深清晰画质（Deep focus shot），所有人五官均保持锐利。画面严禁过曝，杜绝面部油光，表情愉悦随和。Negative Prompt: blurred face, out of focus, overexposed highlights, oily forehead, greasy skin, hunchback.四、分镜动作Cinematic deep focus shot, the bride is in the foreground, turning back to smile cutely at the lens, her face is sharp and clear. The groom stands several meters behind her in the background path, also in sharp focus, looking at her with a happy, playful gaze. Strong spatial depth with full clarity. --ar 16:9",
        aspectRatio: "16:9",
        scene: "中式园林",
        pose: "D",
        styleTags: ["中式园林", "新中式", "亭台", "典雅"]
      },
      {
        name: "E",
        prompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：\n\n核心任务：超高清竖构图（3:4）。富士胶卷相片风格（Fuji Film Style），保留细腻的胶片颗粒感与清冷通透的质感。非对称构图，光影明暗对比强烈，具有故事感。背景为中式园林绿植，色调经过消色处理，呈现复古冷咖与暗绿交织的怀旧底色。\n\n一、人物绑定（最高优先级）\n\n人物：严格使用您上传的肖像。男性为唯一新郎，女性为唯一新娘。每张图为双人照或新娘单人照。\n\n肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。\n\n身材比例：男性身高约180cm，身形挺挺拔；女性身形修长。双人同框时，男性明显高于女性（15-20cm），比例自然，展现优雅形体美，严禁佝偻。\n\n二、造型细节\n\n新娘： 白色蕾丝婚纱搭配精致的花饰头纱，佩戴高质感珍珠配饰（项链与耳环）；发型为黑色复古盘发，手持一束色调柔和的水洗感花束；妆容温婉优雅。\n\n新郎： 穿着笔挺的纯黑色西装搭配精致领结；发型为黑色复古背头，面如冠玉，眼神清澈帅气，展现民国公子的贵气。\n\n三、场景与画质\n\n场景： 室外中式园林，石径与复古花窗。\n\n光影与画质： 暖调侧逆光影，脸部带有轻微的电影感漏光（light leaks）。画面坚决不能过曝（no overexposure），严禁面部油光（matte and warm skin），表情可爱且随和，眼神清澈有神（sparkling eyes）。配件（珍珠、花束、提箱）质感写实逼真。Negative Prompt: shiny skin, overexposed, slouching, dull eyes.\n\n四、分镜动作\n\nFull body shot, the couple standing by a circular moon gate in the garden. The bride is leaning sweet and gently against the groom's chest. They are both looking at the lens with joyful, lovely smiles. Their silhouettes are elegant and upright. --ar 3:4",
        rawPrompt: "以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：核心任务：超高清竖构图（3:4）。富士胶卷相片风格（Fuji Film Style），保留细腻的胶片颗粒感与清冷通透的质感。非对称构图，光影明暗对比强烈，具有故事感。背景为中式园林绿植，色调经过消色处理，呈现复古冷咖与暗绿交织的怀旧底色。一、人物绑定（最高优先级）人物：严格使用您上传的肖像。男性为唯一新郎，女性为唯一新娘。每张图为双人照或新娘单人照。肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。身材比例：男性身高约180cm，身形挺挺拔；女性身形修长。双人同框时，男性明显高于女性（15-20cm），比例自然，展现优雅形体美，严禁佝偻。二、造型细节新娘： 白色蕾丝婚纱搭配精致的花饰头纱，佩戴高质感珍珠配饰（项链与耳环）；发型为黑色复古盘发，手持一束色调柔和的水洗感花束；妆容温婉优雅。新郎： 穿着笔挺的纯黑色西装搭配精致领结；发型为黑色复古背头，面如冠玉，眼神清澈帅气，展现民国公子的贵气。三、场景与画质场景： 室外中式园林，石径与复古花窗。光影与画质： 暖调侧逆光影，脸部带有轻微的电影感漏光（light leaks）。画面坚决不能过曝（no overexposure），严禁面部油光（matte and warm skin），表情可爱且随和，眼神清澈有神（sparkling eyes）。配件（珍珠、花束、提箱）质感写实逼真。Negative Prompt: shiny skin, overexposed, slouching, dull eyes.四、分镜动作Full body shot, the couple standing by a circular moon gate in the garden. The bride is leaning sweet and gently against the groom's chest. They are both looking at the lens with joyful, lovely smiles. Their silhouettes are elegant and upright. --ar 3:4",
        aspectRatio: "3:4",
        scene: "中式园林",
        pose: "E",
        styleTags: ["中式园林", "新中式", "亭台", "典雅"]
      }
    ]
  })
];

export const weddingPrompts = weddingThemes.flatMap((theme) => theme.prompts.map((prompt) => prompt.rawPrompt));

export function getWeddingTheme(themeId: string) {
  return weddingThemes.find((theme) => theme.themeId === themeId) ?? null;
}

export function getSelectedThemes(themeIds: string[]) {
  const selected = themeIds.map(getWeddingTheme).filter((theme): theme is WeddingTheme => Boolean(theme));
  return selected.length > 0 ? selected.slice(0, 2) : weddingThemes.slice(0, 1);
}

export function buildGenerationPlan(themeIds: string[]): GenerationPromptPlan[] {
  const selectedThemes = getSelectedThemes(themeIds);
  const otherThemes = weddingThemes.filter(
    (t) => !selectedThemes.some((s) => s.themeId === t.themeId)
  );

  // 选中主题：全部 5 张 (A-E)
  const selectedItems = selectedThemes.flatMap((theme) =>
    theme.prompts.map((prompt) => ({
      theme,
      prompt,
      type: "normal" as const,
      themeKey: theme.themeId,
      promptIndex: theme.prompts.findIndex((p) => p.id === prompt.id),
      promptTitle: prompt.name,
      isCoverPrompt: prompt.isCoverPrompt,
    }))
  );

  // 其他主题：只取首图 cover (A)
  const otherCoverItems = otherThemes.flatMap((theme) => {
    const coverPrompt = theme.prompts.find((p) => p.isCoverPrompt) ?? theme.prompts[0];
    return [
      {
        theme,
        prompt: coverPrompt,
        type: "recommendation" as const,
        themeKey: theme.themeId,
        promptIndex: theme.prompts.findIndex((p) => p.id === coverPrompt.id),
        promptTitle: coverPrompt.name,
        isCoverPrompt: true,
      },
    ];
  });

  // 先排选中主题，再排推荐首图
  return [...selectedItems, ...otherCoverItems];
}

export function buildPreviewGenerationPlan(themeIds: string[]) {
  return buildGenerationPlan(themeIds);
}
