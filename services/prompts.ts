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
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。侧脸特写（Side-profile close-up），富士胶卷相片风格（Fuji Film Style），清冷通透。光线明暗对比强烈，呈现电影质感的人像光影故事。保留细腻胶片颗粒感，具有浓郁的回忆感。

一、人物绑定（最高优先级）

人物：严格使用您上传的肖像。男性为新郎（民国贵公子气），女性为新娘（温婉优雅）。男性身形挺拔，颈部舒展，形体严禁佝偻。

肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。新郎面如冠玉，英俊帅气，眼神清澈有神，严禁小眼睛或日本脸特征。

二、造型细节

新娘：身着白色蕾丝婚纱，面料质感细腻；佩戴精致的花饰头纱，头纱具有通透的轻盈感；发型为黑色复古盘发。佩戴高质感珍珠项链与珍珠饰品，折射出柔和珠光。

新郎：穿着笔挺的黑色西装搭配精致领结。发型为黑色复古短背头，打理得整洁油亮。妆容干净自然，呈现出民国时期的高级审美。

三、场景与画质

场景：古旧的中式木质背景（weathered wood background），木纹质感清晰。

光影与画质：暖调侧光勾勒人物面部轮廓，侧脸线条流畅美观。脸部带有轻微的电影感漏光（light leaks）。面部温润哑光，坚决不能泛油光（matte finish only）。Negative Prompt: no oily skin, no overexposure, no small eyes for groom, no slouching, no bright green, no blurred face.

四、分镜动作

Medium close-up from a side profile perspective. The bride is leaning sweet and gently against the groom's shoulder, looking towards the lens with a happy, amiable expression. The groom is looking slightly away, showcasing his sharp jawline and noble posture. Intimate and nostalgic atmosphere. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。侧脸特写（Side-profile close-up），富士胶卷相片风格（Fuji Film Style），清冷通透。光线明暗对比强烈，呈现电影质感的人像光影故事。保留细腻胶片颗粒感，具有浓郁的回忆感。 一、人物绑定（最高优先级） 人物：严格使用您上传的肖像。男性为新郎（民国贵公子气），女性为新娘（温婉优雅）。男性身形挺拔，颈部舒展，形体严禁佝偻。 肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。新郎面如冠玉，英俊帅气，眼神清澈有神，严禁小眼睛或日本脸特征。 二、造型细节 新娘：身着白色蕾丝婚纱，面料质感细腻；佩戴精致的花饰头纱，头纱具有通透的轻盈感；发型为黑色复古盘发。佩戴高质感珍珠项链与珍珠饰品，折射出柔和珠光。 新郎：穿着笔挺的黑色西装搭配精致领结。发型为黑色复古短背头，打理得整洁油亮。妆容干净自然，呈现出民国时期的高级审美。 三、场景与画质 场景：古旧的中式木质背景（weathered wood background），木纹质感清晰。 光影与画质：暖调侧光勾勒人物面部轮廓，侧脸线条流畅美观。脸部带有轻微的电影感漏光（light leaks）。面部温润哑光，坚决不能泛油光（matte finish only）。Negative Prompt: no oily skin, no overexposure, no small eyes for groom, no slouching, no bright green, no blurred face. 四、分镜动作 Medium close-up from a side profile perspective. The bride is leaning sweet and gently against the groom's shoulder, looking towards the lens with a happy, amiable expression. The groom is looking slightly away, showcasing his sharp jawline and noble posture. Intimate and nostalgic atmosphere. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "民国芳华·侧颜叙事",
        pose: "A",
        styleTags: []
      },
      {
        name: "B",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。新娘单人照。民国芳华侧颜叙事延展，富士胶卷相片风格，清冷通透，强调珍珠、蕾丝与木质背景的细腻质感。

一、人物绑定（最高优先级）

人物：仅出现女性，新娘单人。严格使用上传的新娘肖像，100%沿用原图五官、脸型、肤色，禁止修改。形体端庄挺拔，严禁缩脖、耸肩、佝偻。

二、造型细节（与本风格全套保持统一）

新娘：白色蕾丝婚纱，通透花饰头纱，黑色复古盘发，珍珠项链与珍珠耳饰。妆容温婉干净，哑光肤质。

新郎：本张为新娘单人照，新郎不出现。

三、场景与画质

场景：古旧中式木质背景，木纹清晰，暖调侧光勾勒面部轮廓。富士胶片颗粒，轻微电影感漏光，面部温润哑光。

Negative Prompt: no groom, no third person, no oily skin, no overexposure, no blurred face, no slouching, no bright green.

四、分镜动作

Medium close-up from a 45-degree side angle. The bride gently holds the pearl necklace near her collarbone, looking slightly down with a shy and happy smile. The lace veil frames her face softly. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。新娘单人照。民国芳华侧颜叙事延展，富士胶卷相片风格，清冷通透，强调珍珠、蕾丝与木质背景的细腻质感。 一、人物绑定（最高优先级） 人物：仅出现女性，新娘单人。严格使用上传的新娘肖像，100%沿用原图五官、脸型、肤色，禁止修改。形体端庄挺拔，严禁缩脖、耸肩、佝偻。 二、造型细节（与本风格全套保持统一） 新娘：白色蕾丝婚纱，通透花饰头纱，黑色复古盘发，珍珠项链与珍珠耳饰。妆容温婉干净，哑光肤质。 新郎：本张为新娘单人照，新郎不出现。 三、场景与画质 场景：古旧中式木质背景，木纹清晰，暖调侧光勾勒面部轮廓。富士胶片颗粒，轻微电影感漏光，面部温润哑光。 Negative Prompt: no groom, no third person, no oily skin, no overexposure, no blurred face, no slouching, no bright green. 四、分镜动作 Medium close-up from a 45-degree side angle. The bride gently holds the pearl necklace near her collarbone, looking slightly down with a shy and happy smile. The lace veil frames her face softly. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "民国芳华·侧颜叙事",
        pose: "B",
        styleTags: []
      },
      {
        name: "C",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。新郎单人照。民国贵公子气质，强调黑色西装、领结、复古短背头与清冷胶片质感。

一、人物绑定（最高优先级）

人物：仅出现男性，新郎单人。严格使用上传的新郎肖像，100%还原五官、脸型、肤色。新郎英俊帅气，眼神清澈有神，身形挺拔，严禁小眼睛、日本脸特征、佝偻。

二、造型细节（与本风格全套保持统一）

新郎：笔挺黑色西装搭配精致领结，黑色复古短背头，头发整洁油亮但不显油腻。妆容干净自然，高级哑光肤质。

新娘：本张为新郎单人照，新娘不出现。

三、场景与画质

场景：中式木质背景与柔和侧光。富士胶卷清冷感，细腻颗粒，脸部微弱漏光。面部温润哑光，严禁油光、过曝、虚焦。

Negative Prompt: no bride, no third person, no oily skin, no overexposure, no small eyes for groom, no Japanese facial features, no long hair, no slouching.

四、分镜动作

Medium portrait shot. The groom stands upright beside the weathered wooden wall, one hand adjusting his bowtie, looking slightly away from the lens to show a sharp jawline and noble posture. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。新郎单人照。民国贵公子气质，强调黑色西装、领结、复古短背头与清冷胶片质感。 一、人物绑定（最高优先级） 人物：仅出现男性，新郎单人。严格使用上传的新郎肖像，100%还原五官、脸型、肤色。新郎英俊帅气，眼神清澈有神，身形挺拔，严禁小眼睛、日本脸特征、佝偻。 二、造型细节（与本风格全套保持统一） 新郎：笔挺黑色西装搭配精致领结，黑色复古短背头，头发整洁油亮但不显油腻。妆容干净自然，高级哑光肤质。 新娘：本张为新郎单人照，新娘不出现。 三、场景与画质 场景：中式木质背景与柔和侧光。富士胶卷清冷感，细腻颗粒，脸部微弱漏光。面部温润哑光，严禁油光、过曝、虚焦。 Negative Prompt: no bride, no third person, no oily skin, no overexposure, no small eyes for groom, no Japanese facial features, no long hair, no slouching. 四、分镜动作 Medium portrait shot. The groom stands upright beside the weathered wooden wall, one hand adjusting his bowtie, looking slightly away from the lens to show a sharp jawline and noble posture. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "民国芳华·侧颜叙事",
        pose: "C",
        styleTags: []
      },
      {
        name: "D",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：电影宽银幕（16:9）。中式回廊全景深合影，利用前后空间制造电影叙事，前后人物五官全部清晰锐利。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像，新郎英俊挺拔，新娘温婉优雅。肖像100%还原。新郎短发复古背头，严禁长发、小眼睛、日本脸特征；两人严禁佝偻。

二、造型细节（与本风格全套保持统一）

新娘：白色蕾丝婚纱，花饰头纱，珍珠配饰，黑色复古盘发，妆容温婉哑光。

新郎：黑色西装、精致领结、黑色复古短背头，妆容干净自然。

三、场景与画质

场景：中式园林木质回廊，透视纵深明显。全景深 Deep focus，人物、木纹、蕾丝、领结全部清晰。富士胶片清冷质感，面部无油光。

Negative Prompt: blurred face, out of focus, no overexposure, no oily skin, no long hair for groom, no Japanese facial features, no small eyes for groom.

四、分镜动作

Cinematic deep focus shot. The bride stands in the foreground turning back with a sweet smile, while the groom stands several meters behind in the corridor, also sharp and clear, looking at her warmly. --ar 16:9`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：电影宽银幕（16:9）。中式回廊全景深合影，利用前后空间制造电影叙事，前后人物五官全部清晰锐利。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像，新郎英俊挺拔，新娘温婉优雅。肖像100%还原。新郎短发复古背头，严禁长发、小眼睛、日本脸特征；两人严禁佝偻。 二、造型细节（与本风格全套保持统一） 新娘：白色蕾丝婚纱，花饰头纱，珍珠配饰，黑色复古盘发，妆容温婉哑光。 新郎：黑色西装、精致领结、黑色复古短背头，妆容干净自然。 三、场景与画质 场景：中式园林木质回廊，透视纵深明显。全景深 Deep focus，人物、木纹、蕾丝、领结全部清晰。富士胶片清冷质感，面部无油光。 Negative Prompt: blurred face, out of focus, no overexposure, no oily skin, no long hair for groom, no Japanese facial features, no small eyes for groom. 四、分镜动作 Cinematic deep focus shot. The bride stands in the foreground turning back with a sweet smile, while the groom stands several meters behind in the corridor, also sharp and clear, looking at her warmly. --ar 16:9`,
        aspectRatio: "16:9",
        scene: "民国芳华·侧颜叙事",
        pose: "D",
        styleTags: []
      },
      {
        name: "E",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：电影宽银幕（16:9）。自然互动合影，强调民国芳华的松弛、甜蜜与回忆感。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像，100%还原。男性身形挺拔，女性形体优雅。新郎为黑色短发复古背头，严禁长头发、佝偻、小眼睛、日本脸特征。

二、造型细节（与本风格全套保持统一）

新娘：白色蕾丝婚纱，花饰头纱，珍珠项链，黑色复古盘发。

新郎：笔挺黑西装，精致领结，黑色复古短背头。两人妆容均为温润哑光质感。

三、场景与画质

场景：中式园林石阶与木质墙壁，非对称构图，可出现复古行李箱。富士胶片颗粒，清冷通透，暖侧光勾勒轮廓。面部严禁油光与死白过曝。

Negative Prompt: overexposed highlights, greasy skin, hunchback, no long hair, no small eyes, no blurred face, vibrant green background.

四、分镜动作

Wide cinematic shot. The couple sits casually on the edge of a vintage suitcase near the wooden wall, facing each other and laughing naturally. --ar 16:9`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：电影宽银幕（16:9）。自然互动合影，强调民国芳华的松弛、甜蜜与回忆感。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像，100%还原。男性身形挺拔，女性形体优雅。新郎为黑色短发复古背头，严禁长头发、佝偻、小眼睛、日本脸特征。 二、造型细节（与本风格全套保持统一） 新娘：白色蕾丝婚纱，花饰头纱，珍珠项链，黑色复古盘发。 新郎：笔挺黑西装，精致领结，黑色复古短背头。两人妆容均为温润哑光质感。 三、场景与画质 场景：中式园林石阶与木质墙壁，非对称构图，可出现复古行李箱。富士胶片颗粒，清冷通透，暖侧光勾勒轮廓。面部严禁油光与死白过曝。 Negative Prompt: overexposed highlights, greasy skin, hunchback, no long hair, no small eyes, no blurred face, vibrant green background. 四、分镜动作 Wide cinematic shot. The couple sits casually on the edge of a vintage suitcase near the wooden wall, facing each other and laughing naturally. --ar 16:9`,
        aspectRatio: "16:9",
        scene: "民国芳华·侧颜叙事",
        pose: "E",
        styleTags: []
      },
      {
        name: "F",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。甜蜜中近景合影，突出表情可爱、头纱通透和珍珠珠光。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像，100%还原。新郎英俊帅气，新娘温婉。新郎黑色短发复古背头，身形挺拔，严禁长发、佝偻、小眼睛、日本脸特征。

二、造型细节（与本风格全套保持统一）

新娘：白色蕾丝婚纱，花饰头纱，黑色复古盘发，珍珠项链与耳饰。

新郎：纯黑色西装，精致领结，干净自然哑光妆容。

三、场景与画质

场景：木质背景前的暖调光影。富士胶片质感，轻微漏光，画面不过曝，面部无油光。

Negative Prompt: shiny forehead, oily face, no overexposure, no slouching, no expressionless face, no long hair for groom, groom's eyes too small.

四、分镜动作

Medium shot. The couple stands close together with their heads gently touching. The bride holds the bouquet near her chin and smiles sweetly into the lens. The groom leans slightly toward her with an amiable smile. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。甜蜜中近景合影，突出表情可爱、头纱通透和珍珠珠光。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像，100%还原。新郎英俊帅气，新娘温婉。新郎黑色短发复古背头，身形挺拔，严禁长发、佝偻、小眼睛、日本脸特征。 二、造型细节（与本风格全套保持统一） 新娘：白色蕾丝婚纱，花饰头纱，黑色复古盘发，珍珠项链与耳饰。 新郎：纯黑色西装，精致领结，干净自然哑光妆容。 三、场景与画质 场景：木质背景前的暖调光影。富士胶片质感，轻微漏光，画面不过曝，面部无油光。 Negative Prompt: shiny forehead, oily face, no overexposure, no slouching, no expressionless face, no long hair for groom, groom's eyes too small. 四、分镜动作 Medium shot. The couple stands close together with their heads gently touching. The bride holds the bouquet near her chin and smiles sweetly into the lens. The groom leans slightly toward her with an amiable smile. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "民国芳华·侧颜叙事",
        pose: "F",
        styleTags: []
      },
      {
        name: "G",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清横构图（3:2）。怀旧复古叙事合影，展现行走间的形体美和温柔互动。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像，100%还原。男性明显高于女性，身形笔挺如青松；女性端庄优雅。新郎为黑色短发复古背头，严禁长发、佝偻、小眼睛、日本脸特征。

二、造型细节（与本风格全套保持统一）

新娘：白色蕾丝婚纱，花饰头纱轻盈飘动，珍珠配饰真实珠光，黑色复古盘发。

新郎：笔挺黑色西装，精致领结，短背头，清澈有神的眼神。

三、场景与画质

场景：园林月亮门与中式木质背景，极简复古色块。4K电影写实，光影平衡，面部温润哑光。

Negative Prompt: 画面死白、面部泛油、模特佝偻驼背、表情木讷、日本脸特征、新郎眼睛过小、男士长发、背景过绿。

四、分镜动作

Full body shot from a low perspective. The couple walks hand-in-hand through a classic moon gate, talking and smiling happily while looking at each other in three-quarter profile. --ar 3:2

━━━━━━━━━━━━━━━━━━━━`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清横构图（3:2）。怀旧复古叙事合影，展现行走间的形体美和温柔互动。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像，100%还原。男性明显高于女性，身形笔挺如青松；女性端庄优雅。新郎为黑色短发复古背头，严禁长发、佝偻、小眼睛、日本脸特征。 二、造型细节（与本风格全套保持统一） 新娘：白色蕾丝婚纱，花饰头纱轻盈飘动，珍珠配饰真实珠光，黑色复古盘发。 新郎：笔挺黑色西装，精致领结，短背头，清澈有神的眼神。 三、场景与画质 场景：园林月亮门与中式木质背景，极简复古色块。4K电影写实，光影平衡，面部温润哑光。 Negative Prompt: 画面死白、面部泛油、模特佝偻驼背、表情木讷、日本脸特征、新郎眼睛过小、男士长发、背景过绿。 四、分镜动作 Full body shot from a low perspective. The couple walks hand-in-hand through a classic moon gate, talking and smiling happily while looking at each other in three-quarter profile. --ar 3:2 ━━━━━━━━━━━━━━━━━━━━`,
        aspectRatio: "3:2",
        scene: "民国芳华·侧颜叙事",
        pose: "G",
        styleTags: []
      },
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
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。1995年港风复古摄影。风格为经典90年代影楼、胶片质感。背景为纯色中国红幕布，色调偏暖红橙调，具有年代沉淀感。

一、人物绑定（最高优先级）

人物：严格使用上传的肖像。女性为新娘，身形纤细。形体挺拔，严禁缩脖或佝偻。

肖像保真：100%沿用原图五官、脸型、肤色。妆容为90年代港风，白皙偏哑光，正红色滋润唇膏。表情自然真实，含羞带笑。

二、造型细节

新娘：黑色长发港式盘发，头顶蓬松，点缀细小珍珠发饰；大红色多层欧根纱头纱，蓬松轻盈。身着大红色抹胸婚纱，胸口有立体褶皱花朵。配饰为珍珠项链与耳坠。手持粉色香水百合、红玫瑰组成的圆润手捧花。

新郎：本张为单人特写，新郎不出现。

三、场景与画质

场景：纯红幕布背景。模拟90年代影楼闪光灯正面直闪效果，面部明亮均匀。

画质与色调：模拟柯达胶卷ISO 400质感，轻微颗粒感，轻微暗角。红色正红偏橘，肤色暖粉调。Negative Prompt: overexposed, oily skin, digital sharp, slouching, Japanese features, modern style, cold tones.

四、分镜动作

Close-up shot. The bride is looking towards the lens with a shy and gentle smile, her head slightly tilted. She holds the bouquet to her chest. Her face is sharp and clear with a matte finish. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。1995年港风复古摄影。风格为经典90年代影楼、胶片质感。背景为纯色中国红幕布，色调偏暖红橙调，具有年代沉淀感。 一、人物绑定（最高优先级） 人物：严格使用上传的肖像。女性为新娘，身形纤细。形体挺拔，严禁缩脖或佝偻。 肖像保真：100%沿用原图五官、脸型、肤色。妆容为90年代港风，白皙偏哑光，正红色滋润唇膏。表情自然真实，含羞带笑。 二、造型细节 新娘：黑色长发港式盘发，头顶蓬松，点缀细小珍珠发饰；大红色多层欧根纱头纱，蓬松轻盈。身着大红色抹胸婚纱，胸口有立体褶皱花朵。配饰为珍珠项链与耳坠。手持粉色香水百合、红玫瑰组成的圆润手捧花。 新郎：本张为单人特写，新郎不出现。 三、场景与画质 场景：纯红幕布背景。模拟90年代影楼闪光灯正面直闪效果，面部明亮均匀。 画质与色调：模拟柯达胶卷ISO 400质感，轻微颗粒感，轻微暗角。红色正红偏橘，肤色暖粉调。Negative Prompt: overexposed, oily skin, digital sharp, slouching, Japanese features, modern style, cold tones. 四、分镜动作 Close-up shot. The bride is looking towards the lens with a shy and gentle smile, her head slightly tilted. She holds the bouquet to her chest. Her face is sharp and clear with a matte finish. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "1995 港风",
        pose: "A",
        styleTags: []
      },
      {
        name: "B",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。1995港风新郎单人肖像，经典90年代影楼胶片质感，纯色中国红幕布背景，暖红橙调。

一、人物绑定（最高优先级）

人物：仅出现男性，新郎单人。严格使用上传肖像，100%还原五官、脸型、肤色。新郎身形挺拔英挺，眼神温柔聚焦，严禁小眼睛、日本脸特征、佝偻。

二、造型细节（与本风格全套保持统一）

新郎：黑色双排扣西装，垫肩廓形明显，白色尖领衬衫，红底格纹领带，左胸红玫瑰胸花，黑色亮面皮鞋。发型为90年代港星短发中分蓬松造型，不得长发。

新娘：本张为新郎单人照，新娘不出现。

三、场景与画质

场景：纯红幕布背景。模拟90年代影楼正面闪光灯，柯达胶卷ISO400质感，轻微颗粒与暗角。肤色暖粉调，面部哑光。

Negative Prompt: no bride, overexposed, oily skin, digital sharp, slouching, Japanese features, small eyes, long hair, modern style, cold tones.

四、分镜动作

Medium portrait shot. The groom stands upright in front of the red curtain, one hand gently adjusting his plaid tie, looking into the lens with a calm and confident smile. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。1995港风新郎单人肖像，经典90年代影楼胶片质感，纯色中国红幕布背景，暖红橙调。 一、人物绑定（最高优先级） 人物：仅出现男性，新郎单人。严格使用上传肖像，100%还原五官、脸型、肤色。新郎身形挺拔英挺，眼神温柔聚焦，严禁小眼睛、日本脸特征、佝偻。 二、造型细节（与本风格全套保持统一） 新郎：黑色双排扣西装，垫肩廓形明显，白色尖领衬衫，红底格纹领带，左胸红玫瑰胸花，黑色亮面皮鞋。发型为90年代港星短发中分蓬松造型，不得长发。 新娘：本张为新郎单人照，新娘不出现。 三、场景与画质 场景：纯红幕布背景。模拟90年代影楼正面闪光灯，柯达胶卷ISO400质感，轻微颗粒与暗角。肤色暖粉调，面部哑光。 Negative Prompt: no bride, overexposed, oily skin, digital sharp, slouching, Japanese features, small eyes, long hair, modern style, cold tones. 四、分镜动作 Medium portrait shot. The groom stands upright in front of the red curtain, one hand gently adjusting his plaid tie, looking into the lens with a calm and confident smile. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "1995 港风",
        pose: "B",
        styleTags: []
      },
      {
        name: "C",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清横构图（3:2）。捕捉两人幸福自然的互动，强调90年代影楼常见的温馨站位。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像。新郎挺拔英挺，新娘纤细优雅，新郎略高于新娘，比例协调。双人神态随和，笑容自然灿烂。

二、造型细节（与本风格全套保持统一）

新娘：大红色抹胸蓬蓬裙婚纱，大红色多层欧根纱头纱，珍珠项链与耳坠，手持粉色香水百合与红玫瑰圆润手捧花，90年代港风哑光白皙妆容，正红色唇膏。

新郎：黑色双排扣西装，白色尖领衬衫，红底格纹领带，红玫瑰胸花，短发中分蓬松造型。

三、场景与画质

场景：纯色中国红幕布。胶片黑色层次分明，高光不过曝，对比度适中偏柔。

Negative Prompt: oily forehead, shiny skin, overexposure, slouching, Japanese features, small eyes, long hair, modern digital look.

四、分镜动作

Medium shot. The groom stands behind the bride to her right, his hands resting gently on her shoulders, leaning in slightly. Both look at the lens with natural, happy smiles. --ar 3:2`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清横构图（3:2）。捕捉两人幸福自然的互动，强调90年代影楼常见的温馨站位。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像。新郎挺拔英挺，新娘纤细优雅，新郎略高于新娘，比例协调。双人神态随和，笑容自然灿烂。 二、造型细节（与本风格全套保持统一） 新娘：大红色抹胸蓬蓬裙婚纱，大红色多层欧根纱头纱，珍珠项链与耳坠，手持粉色香水百合与红玫瑰圆润手捧花，90年代港风哑光白皙妆容，正红色唇膏。 新郎：黑色双排扣西装，白色尖领衬衫，红底格纹领带，红玫瑰胸花，短发中分蓬松造型。 三、场景与画质 场景：纯色中国红幕布。胶片黑色层次分明，高光不过曝，对比度适中偏柔。 Negative Prompt: oily forehead, shiny skin, overexposure, slouching, Japanese features, small eyes, long hair, modern digital look. 四、分镜动作 Medium shot. The groom stands behind the bride to her right, his hands resting gently on her shoulders, leaning in slightly. Both look at the lens with natural, happy smiles. --ar 3:2`,
        aspectRatio: "3:2",
        scene: "1995 港风",
        pose: "C",
        styleTags: []
      },
      {
        name: "D",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。温馨私密的亲昵合影，突出90年代影楼婚纱照的甜蜜氛围。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像，100%还原。两人面面相觑，额头轻轻相触，神态随和幸福。严禁肢体穿模、五官畸变、佝偻。

二、造型细节（与本风格全套保持统一）

新娘：红色抹胸蓬蓬裙，红色欧根纱头纱，珍珠首饰，正红色唇膏。

新郎：黑色双排扣西装，格纹领带，红玫瑰胸花，90年代短发中分造型。

三、场景与画质

场景：深红幕布背景。面部有柔和阴影过渡，温润哑光皮感，胶片颗粒自然。

Negative Prompt: shiny face, greasy forehead, overexposure, distorted eyes, bad proportions, long hair for groom, modern digital style.

四、分镜动作

Close-up shot of the couple's upper chest and faces. Their foreheads touch gently, eyes softly smiling, with serene and happy expressions. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。温馨私密的亲昵合影，突出90年代影楼婚纱照的甜蜜氛围。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像，100%还原。两人面面相觑，额头轻轻相触，神态随和幸福。严禁肢体穿模、五官畸变、佝偻。 二、造型细节（与本风格全套保持统一） 新娘：红色抹胸蓬蓬裙，红色欧根纱头纱，珍珠首饰，正红色唇膏。 新郎：黑色双排扣西装，格纹领带，红玫瑰胸花，90年代短发中分造型。 三、场景与画质 场景：深红幕布背景。面部有柔和阴影过渡，温润哑光皮感，胶片颗粒自然。 Negative Prompt: shiny face, greasy forehead, overexposure, distorted eyes, bad proportions, long hair for groom, modern digital style. 四、分镜动作 Close-up shot of the couple's upper chest and faces. Their foreheads touch gently, eyes softly smiling, with serene and happy expressions. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "1995 港风",
        pose: "D",
        styleTags: []
      },
      {
        name: "E",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。半身取景，展现90年代影楼婚纱摄影的宏大气场与完整造型。

一、人物绑定（最高优先级）

人物：双人合影。新郎明显高于新娘，形体端正挺拔。双人并肩，身体轻靠，展现喜庆氛围。肖像100%还原，新郎拒绝眯眯眼与长发。

二、造型细节（与本风格全套保持统一）

新娘：大红色抹胸蓬蓬裙婚纱，裙摆体积感庞大，层叠细节清晰，白色蕾丝缎带包扎手捧花。

新郎：黑色双排扣西装，白色尖领衬衫，格纹领带，红玫瑰胸花，短发中分蓬松造型。

三、场景与画质

场景：中国红幕布，纯净无杂物。整体暖色调，红色正红偏橘，暗部细节丰富，胶片感十足。

Negative Prompt: 画面死白, 面部泛油, 模特佝偻, 日本脸, 男士长发, 现代感, 荧光红, 杂乱背景.

四、分镜动作

Full body shot. The couple stands side-by-side in front of the red curtain. The groom’s arm is naturally around the bride’s waist. Both look into the camera with bright, joyful smiles. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。半身取景，展现90年代影楼婚纱摄影的宏大气场与完整造型。 一、人物绑定（最高优先级） 人物：双人合影。新郎明显高于新娘，形体端正挺拔。双人并肩，身体轻靠，展现喜庆氛围。肖像100%还原，新郎拒绝眯眯眼与长发。 二、造型细节（与本风格全套保持统一） 新娘：大红色抹胸蓬蓬裙婚纱，裙摆体积感庞大，层叠细节清晰，白色蕾丝缎带包扎手捧花。 新郎：黑色双排扣西装，白色尖领衬衫，格纹领带，红玫瑰胸花，短发中分蓬松造型。 三、场景与画质 场景：中国红幕布，纯净无杂物。整体暖色调，红色正红偏橘，暗部细节丰富，胶片感十足。 Negative Prompt: 画面死白, 面部泛油, 模特佝偻, 日本脸, 男士长发, 现代感, 荧光红, 杂乱背景. 四、分镜动作 Full body shot. The couple stands side-by-side in front of the red curtain. The groom’s arm is naturally around the bride’s waist. Both look into the camera with bright, joyful smiles. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "1995 港风",
        pose: "E",
        styleTags: []
      },
      {
        name: "F",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：电影宽银幕（16:9）。1995港风系列温馨合影，结合拥抱与看镜头互动感。

一、人物绑定（最高优先级）

人物：双人合影。新郎从身后环抱新娘，新娘微微侧身回头。比例自然，形体挺拔不佝偻。肖像100%还原。新郎短发，眼神宠溺；新娘笑容灿烂。

二、造型细节（与本风格全套保持统一）

新娘：大红色多层欧根纱头纱自然垂落，大红色婚纱光泽真实，珍珠首饰清晰。

新郎：黑色双排扣西装，格纹领带，红玫瑰胸花，短发中分蓬松造型，黑色亮面皮鞋。

三、场景与画质

场景：中国红幕布背景。整体色彩饱和但不刺眼，暖红橙调，4K冲印质感。

Negative Prompt: 画面发白, 面部油腻, 模特佝偻, 日本脸特征, 眼睛过小, 男士长发, 现代荧光色, 抠图感.

四、分镜动作

Medium shot. The groom embraces the bride from behind around her waist. The bride tilts her head back slightly to look at the camera, leaning against the groom. Both are smiling warmly. --ar 16:9`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：电影宽银幕（16:9）。1995港风系列温馨合影，结合拥抱与看镜头互动感。 一、人物绑定（最高优先级） 人物：双人合影。新郎从身后环抱新娘，新娘微微侧身回头。比例自然，形体挺拔不佝偻。肖像100%还原。新郎短发，眼神宠溺；新娘笑容灿烂。 二、造型细节（与本风格全套保持统一） 新娘：大红色多层欧根纱头纱自然垂落，大红色婚纱光泽真实，珍珠首饰清晰。 新郎：黑色双排扣西装，格纹领带，红玫瑰胸花，短发中分蓬松造型，黑色亮面皮鞋。 三、场景与画质 场景：中国红幕布背景。整体色彩饱和但不刺眼，暖红橙调，4K冲印质感。 Negative Prompt: 画面发白, 面部油腻, 模特佝偻, 日本脸特征, 眼睛过小, 男士长发, 现代荧光色, 抠图感. 四、分镜动作 Medium shot. The groom embraces the bride from behind around her waist. The bride tilts her head back slightly to look at the camera, leaning against the groom. Both are smiling warmly. --ar 16:9`,
        aspectRatio: "16:9",
        scene: "1995 港风",
        pose: "F",
        styleTags: []
      },
      {
        name: "G",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：电影宽银幕（16:9）。90年代港风影楼收束画面，突出红幕布、花束与幸福仪式感。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像，100%还原。两人正面或三分之四侧身面对镜头，绝不纯背影。新郎短发挺拔，新娘纤细优雅。

二、造型细节（与本风格全套保持统一）

新娘：红色抹胸蓬蓬裙，红色欧根纱头纱，珍珠配饰，90年代港风哑光妆容，正红唇。

新郎：黑色双排扣西装，格纹领带，红玫瑰胸花，短发中分蓬松造型。

三、场景与画质

场景：纯中国红幕布，影楼闪光灯质感，胶片颗粒，轻微暗角，肤色暖粉调。

Negative Prompt: no pure back view, oily skin, overexposed, slouching, long hair for groom, Japanese features, small eyes, modern digital look.

四、分镜动作

Wide studio shot. The bride stands slightly in front holding the bouquet at waist level, the groom stands beside her with one hand gently supporting her back. Both look toward the lens with festive, natural smiles. --ar 16:9

━━━━━━━━━━━━━━━━━━━━`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：电影宽银幕（16:9）。90年代港风影楼收束画面，突出红幕布、花束与幸福仪式感。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像，100%还原。两人正面或三分之四侧身面对镜头，绝不纯背影。新郎短发挺拔，新娘纤细优雅。 二、造型细节（与本风格全套保持统一） 新娘：红色抹胸蓬蓬裙，红色欧根纱头纱，珍珠配饰，90年代港风哑光妆容，正红唇。 新郎：黑色双排扣西装，格纹领带，红玫瑰胸花，短发中分蓬松造型。 三、场景与画质 场景：纯中国红幕布，影楼闪光灯质感，胶片颗粒，轻微暗角，肤色暖粉调。 Negative Prompt: no pure back view, oily skin, overexposed, slouching, long hair for groom, Japanese features, small eyes, modern digital look. 四、分镜动作 Wide studio shot. The bride stands slightly in front holding the bouquet at waist level, the groom stands beside her with one hand gently supporting her back. Both look toward the lens with festive, natural smiles. --ar 16:9 ━━━━━━━━━━━━━━━━━━━━`,
        aspectRatio: "16:9",
        scene: "1995 港风",
        pose: "G",
        styleTags: []
      },
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
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：生成超高清竖构图（3:4）韩式海景婚纱摄影作品。风格为冷蓝色调、电影质感。背景为波光粼粼的蔚蓝海面。

一、人物绑定（最高优先级）

人物：严格使用您上传的肖像。男性为唯一新郎，女性为唯一新娘。每张图为双人照或新娘单人照。

肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。

身材比例：男性身高约180cm，身形挺拔；女性身形修长。双人同框时，男性明显高于女性（15-20cm），比例自然。

二、造型细节

新娘：黑色直发，韩式低盘发，留有碎发丝。妆容为清透奶油肌，自然野生眉，正红色丝绒唇。身着抹胸心形领口鱼尾婚纱，通体点缀立体小花、珠片刺绣。佩戴超长飘逸头纱（2-3米），上有稀疏立体花、珍珠装饰。可选珍珠耳饰与薄纱长手套。

新郎：黑色短发，纹理感造型。妆容干净自然。身着深灰色修身羊毛质感西装套装，白衬衫，深色领带，黑色皮鞋。

三、场景与画质

背景：开阔海面，海水清透蓝绿色。阳光洒落形成密集、梦幻的圆形光斑（bokeh）。前景为自然礁石或鹅卵石滩。

光影：黄金时段逆光/侧逆光，人物有柔和轮廓光。面部补光均匀。

色调：整体冷蓝色调，清透高级。肤色白皙带冷调粉感。

画质：超高清，保留皮肤纹理、婚纱蕾丝与珠片细节。景深自然，背景虚化柔和。

禁止：任何现代建筑、杂物、浑浊海水、暖黄暗沉色调、过度磨皮、AI假笑**k5％。

四、分镜动作

背后相依：新郎从后环抱新娘，脸颊相贴。新娘双手覆于新郎手上，温柔看向镜头。亲密半身照。--ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：生成超高清竖构图（3:4）韩式海景婚纱摄影作品。风格为冷蓝色调、电影质感。背景为波光粼粼的蔚蓝海面。 一、人物绑定（最高优先级） 人物：严格使用您上传的肖像。男性为唯一新郎，女性为唯一新娘。每张图为双人照或新娘单人照。 肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。 身材比例：男性身高约180cm，身形挺拔；女性身形修长。双人同框时，男性明显高于女性（15-20cm），比例自然。 二、造型细节 新娘：黑色直发，韩式低盘发，留有碎发丝。妆容为清透奶油肌，自然野生眉，正红色丝绒唇。身着抹胸心形领口鱼尾婚纱，通体点缀立体小花、珠片刺绣。佩戴超长飘逸头纱（2-3米），上有稀疏立体花、珍珠装饰。可选珍珠耳饰与薄纱长手套。 新郎：黑色短发，纹理感造型。妆容干净自然。身着深灰色修身羊毛质感西装套装，白衬衫，深色领带，黑色皮鞋。 三、场景与画质 背景：开阔海面，海水清透蓝绿色。阳光洒落形成密集、梦幻的圆形光斑（bokeh）。前景为自然礁石或鹅卵石滩。 光影：黄金时段逆光/侧逆光，人物有柔和轮廓光。面部补光均匀。 色调：整体冷蓝色调，清透高级。肤色白皙带冷调粉感。 画质：超高清，保留皮肤纹理、婚纱蕾丝与珠片细节。景深自然，背景虚化柔和。 禁止：任何现代建筑、杂物、浑浊海水、暖黄暗沉色调、过度磨皮、AI假笑**k5％。 四、分镜动作 背后相依：新郎从后环抱新娘，脸颊相贴。新娘双手覆于新郎手上，温柔看向镜头。亲密半身照。--ar 3:4`,
        aspectRatio: "3:4",
        scene: "水边",
        pose: "A",
        styleTags: []
      },
      {
        name: "B",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。韩式海景新娘单人照，冷蓝色调、电影质感，背景为波光粼粼的蔚蓝海面。

一、人物绑定（最高优先级）

人物：仅出现女性，新娘单人。严格使用上传的新娘肖像，100%沿用原图五官、脸型、肤色。身形修长，肩颈舒展，严禁缩脖、耸肩、佝偻。

二、造型细节（与本风格全套保持统一）

新娘：韩式低盘发，留有碎发丝；清透奶油肌，自然野生眉，正红色丝绒唇。身着抹胸心形领口鱼尾婚纱，立体小花、珠片刺绣，超长飘逸头纱，珍珠耳饰与薄纱长手套。

新郎：本张为新娘单人照，新郎不出现。

三、场景与画质

背景：开阔蓝绿色海面，阳光形成梦幻圆形光斑，前景为自然礁石或鹅卵石滩。冷蓝色调，肤色白皙带冷粉，面部补光均匀。

Negative Prompt: no groom, no third person, modern buildings, muddy water, warm yellow tones, oily skin, overexposure, bad veil, AI fake smile.

四、分镜动作

Medium full shot. The bride stands on the reef, gently holding her long veil with both hands, looking into the lens with a soft serene smile. The veil floats sideways in the sea breeze. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。韩式海景新娘单人照，冷蓝色调、电影质感，背景为波光粼粼的蔚蓝海面。 一、人物绑定（最高优先级） 人物：仅出现女性，新娘单人。严格使用上传的新娘肖像，100%沿用原图五官、脸型、肤色。身形修长，肩颈舒展，严禁缩脖、耸肩、佝偻。 二、造型细节（与本风格全套保持统一） 新娘：韩式低盘发，留有碎发丝；清透奶油肌，自然野生眉，正红色丝绒唇。身着抹胸心形领口鱼尾婚纱，立体小花、珠片刺绣，超长飘逸头纱，珍珠耳饰与薄纱长手套。 新郎：本张为新娘单人照，新郎不出现。 三、场景与画质 背景：开阔蓝绿色海面，阳光形成梦幻圆形光斑，前景为自然礁石或鹅卵石滩。冷蓝色调，肤色白皙带冷粉，面部补光均匀。 Negative Prompt: no groom, no third person, modern buildings, muddy water, warm yellow tones, oily skin, overexposure, bad veil, AI fake smile. 四、分镜动作 Medium full shot. The bride stands on the reef, gently holding her long veil with both hands, looking into the lens with a soft serene smile. The veil floats sideways in the sea breeze. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "水边",
        pose: "B",
        styleTags: []
      },
      {
        name: "C",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。韩式海景新郎单人照，冷蓝电影感，突出深灰羊毛西装质感与挺拔形体。

一、人物绑定（最高优先级）

人物：仅出现男性，新郎单人。严格使用上传的新郎肖像，100%还原。男性身高约180cm，身形挺拔，眼神清澈有神，严禁小眼睛、日本脸特征、长发、佝偻。

二、造型细节（与本风格全套保持统一）

新郎：黑色短发，纹理感造型；妆容干净自然。深灰色修身羊毛质感西装套装，白衬衫，深色领带，黑色皮鞋。

新娘：本张为新郎单人照，新娘不出现。

三、场景与画质

背景：冷蓝海面与礁石，阳光在水面形成密集bokeh。肤色白皙冷粉调，面部哑光，羊毛纹理清晰。

Negative Prompt: no bride, no third person, no long hair, no Japanese facial features, no small eyes for groom, no oily skin, no overexposure, no muddy water.

四、分镜动作

Medium portrait shot. The groom stands upright on the reef, one hand adjusting his dark tie, looking calmly into the lens. The shimmering ocean creates a soft blue bokeh behind him. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。韩式海景新郎单人照，冷蓝电影感，突出深灰羊毛西装质感与挺拔形体。 一、人物绑定（最高优先级） 人物：仅出现男性，新郎单人。严格使用上传的新郎肖像，100%还原。男性身高约180cm，身形挺拔，眼神清澈有神，严禁小眼睛、日本脸特征、长发、佝偻。 二、造型细节（与本风格全套保持统一） 新郎：黑色短发，纹理感造型；妆容干净自然。深灰色修身羊毛质感西装套装，白衬衫，深色领带，黑色皮鞋。 新娘：本张为新郎单人照，新娘不出现。 三、场景与画质 背景：冷蓝海面与礁石，阳光在水面形成密集bokeh。肤色白皙冷粉调，面部哑光，羊毛纹理清晰。 Negative Prompt: no bride, no third person, no long hair, no Japanese facial features, no small eyes for groom, no oily skin, no overexposure, no muddy water. 四、分镜动作 Medium portrait shot. The groom stands upright on the reef, one hand adjusting his dark tie, looking calmly into the lens. The shimmering ocean creates a soft blue bokeh behind him. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "水边",
        pose: "C",
        styleTags: []
      },
      {
        name: "D",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：生成超高清横构图（16:9）韩式海景婚纱摄影作品。冷蓝色调、电影质感，背景为波光粼粼的蔚蓝海面。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像。男性为唯一新郎，女性为唯一新娘。男性明显高于女性，比例自然，身形挺拔不佝偻。新郎短发，严禁长发、小眼睛、日本脸特征。

二、造型细节（与本风格全套保持统一）

新娘：抹胸心形领口鱼尾婚纱，立体小花与珠片刺绣，超长头纱，韩式低盘发，正红丝绒唇。

新郎：深灰色修身羊毛西装，白衬衫，深色领带，黑色短发纹理造型。

三、场景与画质

场景：开阔海面，清透蓝绿色海水，前景自然礁石。黄金时段侧逆光，人物轮廓光柔和。

Negative Prompt: modern buildings, muddy water, warm yellow tones, overexposure, oily skin, slouching, long hair for groom, Japanese facial features.

四、分镜动作

Full body shot. The couple stands on a dark reef. The groom stands slightly behind the bride, gently resting his hands on her shoulders. Both look into the lens with amiable, joyful smiles. The long veil flutters elegantly. --ar 16:9`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：生成超高清横构图（16:9）韩式海景婚纱摄影作品。冷蓝色调、电影质感，背景为波光粼粼的蔚蓝海面。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像。男性为唯一新郎，女性为唯一新娘。男性明显高于女性，比例自然，身形挺拔不佝偻。新郎短发，严禁长发、小眼睛、日本脸特征。 二、造型细节（与本风格全套保持统一） 新娘：抹胸心形领口鱼尾婚纱，立体小花与珠片刺绣，超长头纱，韩式低盘发，正红丝绒唇。 新郎：深灰色修身羊毛西装，白衬衫，深色领带，黑色短发纹理造型。 三、场景与画质 场景：开阔海面，清透蓝绿色海水，前景自然礁石。黄金时段侧逆光，人物轮廓光柔和。 Negative Prompt: modern buildings, muddy water, warm yellow tones, overexposure, oily skin, slouching, long hair for groom, Japanese facial features. 四、分镜动作 Full body shot. The couple stands on a dark reef. The groom stands slightly behind the bride, gently resting his hands on her shoulders. Both look into the lens with amiable, joyful smiles. The long veil flutters elegantly. --ar 16:9`,
        aspectRatio: "16:9",
        scene: "水边",
        pose: "D",
        styleTags: []
      },
      {
        name: "E",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清横构图（3:2）。海景自然互动合影，强调蓝色海面、头纱飘动与幸福情绪。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像，100%还原。新郎短发挺拔，新娘修长优雅。两人正面或三分之四侧身出镜，不得纯背影。

二、造型细节（与本风格全套保持统一）

新娘：韩式低盘发，抹胸鱼尾婚纱，珠片与珍珠细节，薄纱长手套，超长头纱。

新郎：深灰羊毛西装，白衬衫，深色领带，黑色短发纹理造型。

三、场景与画质

场景：海边鹅卵石滩与闪光海面。冷蓝通透，高级电影质感，面部哑光，婚纱细节锐利。

Negative Prompt: no pure back view, no long hair for groom, overexposed skin, oily face, muddy water, modern buildings, bad hands.

四、分镜动作

Medium wide shot. The bride laughs while holding the floating veil, the groom stands beside her holding her hand and looking at her with a warm smile. Both bodies are open toward the camera. --ar 3:2`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清横构图（3:2）。海景自然互动合影，强调蓝色海面、头纱飘动与幸福情绪。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像，100%还原。新郎短发挺拔，新娘修长优雅。两人正面或三分之四侧身出镜，不得纯背影。 二、造型细节（与本风格全套保持统一） 新娘：韩式低盘发，抹胸鱼尾婚纱，珠片与珍珠细节，薄纱长手套，超长头纱。 新郎：深灰羊毛西装，白衬衫，深色领带，黑色短发纹理造型。 三、场景与画质 场景：海边鹅卵石滩与闪光海面。冷蓝通透，高级电影质感，面部哑光，婚纱细节锐利。 Negative Prompt: no pure back view, no long hair for groom, overexposed skin, oily face, muddy water, modern buildings, bad hands. 四、分镜动作 Medium wide shot. The bride laughs while holding the floating veil, the groom stands beside her holding her hand and looking at her with a warm smile. Both bodies are open toward the camera. --ar 3:2`,
        aspectRatio: "3:2",
        scene: "水边",
        pose: "E",
        styleTags: []
      },
      {
        name: "F",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：电影宽银幕（16:9）。韩式海景叙事合影，利用海平线与逆光制造浪漫空间感。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像，100%还原。男性身形笔挺，女性形体舒展。新郎黑色短发，严禁长发、小眼睛、日本脸特征、佝偻。

二、造型细节（与本风格全套保持统一）

新娘：抹胸鱼尾婚纱，立体小花、珍珠装饰细节逼真，韩式低盘发，超长头纱。

新郎：深灰色羊毛西装，白衬衫，深色领带，黑色短发纹理造型。

三、场景与画质

场景：蔚蓝海边，极简冷蓝色调，水面闪烁柔和光斑。4K电影感，肤质温润哑光。

Negative Prompt: 画面死白、面部泛油、模特佝偻、表情木讷、日本脸特征、新郎眼睛过小、男士长发、背景浑浊。

四、分镜动作

Wide cinematic shot. The couple stands near the waterline, facing the camera in three-quarter profile while holding hands. They smile softly as the veil drifts across the frame. --ar 16:9`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：电影宽银幕（16:9）。韩式海景叙事合影，利用海平线与逆光制造浪漫空间感。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像，100%还原。男性身形笔挺，女性形体舒展。新郎黑色短发，严禁长发、小眼睛、日本脸特征、佝偻。 二、造型细节（与本风格全套保持统一） 新娘：抹胸鱼尾婚纱，立体小花、珍珠装饰细节逼真，韩式低盘发，超长头纱。 新郎：深灰色羊毛西装，白衬衫，深色领带，黑色短发纹理造型。 三、场景与画质 场景：蔚蓝海边，极简冷蓝色调，水面闪烁柔和光斑。4K电影感，肤质温润哑光。 Negative Prompt: 画面死白、面部泛油、模特佝偻、表情木讷、日本脸特征、新郎眼睛过小、男士长发、背景浑浊。 四、分镜动作 Wide cinematic shot. The couple stands near the waterline, facing the camera in three-quarter profile while holding hands. They smile softly as the veil drifts across the frame. --ar 16:9`,
        aspectRatio: "16:9",
        scene: "水边",
        pose: "F",
        styleTags: []
      },
      {
        name: "G",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。海景摄影的叙事闭环，强调亲密半身互动与清透蓝色光影。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像，100%还原。新郎明显高于新娘，短发挺拔；新娘肩颈线条舒展。严禁纯背影、佝偻、虚焦。

二、造型细节（与本风格全套保持统一）

新娘：抹胸鱼尾婚纱，珠片微光，珍珠耳饰，薄纱手套，韩式低盘发。

新郎：深灰色修身羊毛西装，白衬衫，深色领带，黑色短发纹理造型。

三、场景与画质

场景：阳光洒落的冷蓝海面。梦幻bokeh，肤色白皙冷粉，面部无油光，画面不过曝。

Negative Prompt: shiny forehead, oily face, no overexposure, no slouching shoulders, dull eyes, no Japanese facial features, no small eyes for groom, no long hair.

四、分镜动作

Medium shot. The groom playfully whispers to the bride; she laughs heartily with a radiant expression. Their bodies face slightly toward the camera, relaxed and upright. --ar 3:4

━━━━━━━━━━━━━━━━━━━━`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。海景摄影的叙事闭环，强调亲密半身互动与清透蓝色光影。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像，100%还原。新郎明显高于新娘，短发挺拔；新娘肩颈线条舒展。严禁纯背影、佝偻、虚焦。 二、造型细节（与本风格全套保持统一） 新娘：抹胸鱼尾婚纱，珠片微光，珍珠耳饰，薄纱手套，韩式低盘发。 新郎：深灰色修身羊毛西装，白衬衫，深色领带，黑色短发纹理造型。 三、场景与画质 场景：阳光洒落的冷蓝海面。梦幻bokeh，肤色白皙冷粉，面部无油光，画面不过曝。 Negative Prompt: shiny forehead, oily face, no overexposure, no slouching shoulders, dull eyes, no Japanese facial features, no small eyes for groom, no long hair. 四、分镜动作 Medium shot. The groom playfully whispers to the bride; she laughs heartily with a radiant expression. Their bodies face slightly toward the camera, relaxed and upright. --ar 3:4 ━━━━━━━━━━━━━━━━━━━━`,
        aspectRatio: "3:4",
        scene: "水边",
        pose: "G",
        styleTags: []
      },
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
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。逆光电影感，暖橙金调。太阳位于地平线边缘，产生强烈的背光效果，新娘的轮廓被金边勾勒。树林背景被虚化成梦幻的光斑（Bokeh），画面温暖、神圣且充满幸福感。

一、人物绑定（最高优先级）

人物：严格使用您上传的肖像。男性为唯一新郎，女性为唯一新娘。每张图为双人照或新娘单人照。

肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。

身材比例：男性身高约180cm，身形挺拔；女性身形修长。双人同框时，男性明显高于女性（15-20cm），比例自然，身型美感严禁佝偻。

二、造型细节

新娘： 大蓬松的一字肩香槟色叠层纱裙，裙摆点缀立体花朵，面料透光质感极强；发型为侧边大波浪编发，点缀具有金属质感的金色发饰；妆容呈现阳光亲吻的温润感。佩戴精致的碎钻项链，质感闪耀。

新郎： 米色西装内搭浅杏色马甲，不带衬衫领带改为佩戴丝绸材质的复古印花丝巾；袖口微微卷起，腕间佩戴具有机械质感的精钢腕表；黑色利落短发，整体展现出轻松惬意的度假感与温暖气息。

三、场景与画质

场景： 森林背景，植被调低饱和度，排除翠绿色，转为暖咖色。

光影与画质： 逆光电影感。画面坚决不能过曝到丢失细节（no blown-out overexposure），严禁面部油光（matte finish only），表情愉悦随和（joyful and amiable），展现随意的松弛感，严禁佝偻。配件需呈现高奢质感。

四、分镜动作

Full body shot, the couple standing in the center of the glowing forest. The groom is lifting the bride's hand, they are spinning and laughing together. Her dress is glowing with a golden rim light. The vintage suitcase is in the corner. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。逆光电影感，暖橙金调。太阳位于地平线边缘，产生强烈的背光效果，新娘的轮廓被金边勾勒。树林背景被虚化成梦幻的光斑（Bokeh），画面温暖、神圣且充满幸福感。 一、人物绑定（最高优先级） 人物：严格使用您上传的肖像。男性为唯一新郎，女性为唯一新娘。每张图为双人照或新娘单人照。 肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。 身材比例：男性身高约180cm，身形挺拔；女性身形修长。双人同框时，男性明显高于女性（15-20cm），比例自然，身型美感严禁佝偻。 二、造型细节 新娘： 大蓬松的一字肩香槟色叠层纱裙，裙摆点缀立体花朵，面料透光质感极强；发型为侧边大波浪编发，点缀具有金属质感的金色发饰；妆容呈现阳光亲吻的温润感。佩戴精致的碎钻项链，质感闪耀。 新郎： 米色西装内搭浅杏色马甲，不带衬衫领带改为佩戴丝绸材质的复古印花丝巾；袖口微微卷起，腕间佩戴具有机械质感的精钢腕表；黑色利落短发，整体展现出轻松惬意的度假感与温暖气息。 三、场景与画质 场景： 森林背景，植被调低饱和度，排除翠绿色，转为暖咖色。 光影与画质： 逆光电影感。画面坚决不能过曝到丢失细节（no blown-out overexposure），严禁面部油光（matte finish only），表情愉悦随和（joyful and amiable），展现随意的松弛感，严禁佝偻。配件需呈现高奢质感。 四、分镜动作 Full body shot, the couple standing in the center of the glowing forest. The groom is lifting the bride's hand, they are spinning and laughing together. Her dress is glowing with a golden rim light. The vintage suitcase is in the corner. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "黄金时刻梦幻风",
        pose: "A",
        styleTags: []
      },
      {
        name: "B",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。黄金时刻新娘单人照，逆光电影感，暖橙金调，裙摆透光，背景梦幻bokeh。

一、人物绑定（最高优先级）

人物：仅出现女性，新娘单人。严格使用上传的新娘肖像，100%还原。身形修长，肩颈舒展，严禁佝偻、缩脖、耸肩。

二、造型细节（与本风格全套保持统一）

新娘：大蓬松一字肩香槟色叠层纱裙，裙摆点缀立体花朵；侧边大波浪编发，金色发饰，阳光亲吻感温润妆容，碎钻项链。

新郎：本张为新娘单人照，新郎不出现。

三、场景与画质

场景：森林背景，低饱和暖咖色植被，太阳位于地平线边缘，强烈背光勾勒金边。画面不能过曝，面部哑光，配件高奢质感。

Negative Prompt: no groom, no third person, vibrant green, overexposed skin, oily face, slouching posture, dull eyes, blown-out highlights.

四、分镜动作

Full body shot. The bride stands alone in the glowing forest, gently lifting the side of her champagne tulle skirt, smiling softly toward the lens. Golden rim light outlines her veil and dress. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。黄金时刻新娘单人照，逆光电影感，暖橙金调，裙摆透光，背景梦幻bokeh。 一、人物绑定（最高优先级） 人物：仅出现女性，新娘单人。严格使用上传的新娘肖像，100%还原。身形修长，肩颈舒展，严禁佝偻、缩脖、耸肩。 二、造型细节（与本风格全套保持统一） 新娘：大蓬松一字肩香槟色叠层纱裙，裙摆点缀立体花朵；侧边大波浪编发，金色发饰，阳光亲吻感温润妆容，碎钻项链。 新郎：本张为新娘单人照，新郎不出现。 三、场景与画质 场景：森林背景，低饱和暖咖色植被，太阳位于地平线边缘，强烈背光勾勒金边。画面不能过曝，面部哑光，配件高奢质感。 Negative Prompt: no groom, no third person, vibrant green, overexposed skin, oily face, slouching posture, dull eyes, blown-out highlights. 四、分镜动作 Full body shot. The bride stands alone in the glowing forest, gently lifting the side of her champagne tulle skirt, smiling softly toward the lens. Golden rim light outlines her veil and dress. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "黄金时刻梦幻风",
        pose: "B",
        styleTags: []
      },
      {
        name: "C",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。黄金时刻新郎单人照，轻松惬意的度假绅士感，暖橙逆光。

一、人物绑定（最高优先级）

人物：仅出现男性，新郎单人。严格使用上传的新郎肖像，100%还原。男性身高约180cm，身姿挺拔，眼神清澈有神，严禁长发、小眼睛、日本脸特征、佝偻。

二、造型细节（与本风格全套保持统一）

新郎：米色西装，浅杏色马甲，不带衬衫领带，佩戴丝绸复古印花丝巾；袖口微卷，精钢腕表；黑色利落短发，干净自然妆容。

新娘：本张为新郎单人照，新娘不出现。

三、场景与画质

场景：金色森林与暖调草地，植被低饱和暖咖色。逆光勾勒轮廓，腕表金属反光真实，面部无油光。

Negative Prompt: no bride, no third person, high saturation green, oily face, stiff posture, overexposed highlights, slouching, long hair, small eyes.

四、分镜动作

Medium portrait shot. The groom leans lightly against a vintage suitcase, one hand adjusting the silk scarf, looking toward the lens with a relaxed confident smile. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。黄金时刻新郎单人照，轻松惬意的度假绅士感，暖橙逆光。 一、人物绑定（最高优先级） 人物：仅出现男性，新郎单人。严格使用上传的新郎肖像，100%还原。男性身高约180cm，身姿挺拔，眼神清澈有神，严禁长发、小眼睛、日本脸特征、佝偻。 二、造型细节（与本风格全套保持统一） 新郎：米色西装，浅杏色马甲，不带衬衫领带，佩戴丝绸复古印花丝巾；袖口微卷，精钢腕表；黑色利落短发，干净自然妆容。 新娘：本张为新郎单人照，新娘不出现。 三、场景与画质 场景：金色森林与暖调草地，植被低饱和暖咖色。逆光勾勒轮廓，腕表金属反光真实，面部无油光。 Negative Prompt: no bride, no third person, high saturation green, oily face, stiff posture, overexposed highlights, slouching, long hair, small eyes. 四、分镜动作 Medium portrait shot. The groom leans lightly against a vintage suitcase, one hand adjusting the silk scarf, looking toward the lens with a relaxed confident smile. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "黄金时刻梦幻风",
        pose: "C",
        styleTags: []
      },
      {
        name: "D",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：电影宽银幕（16:9）。展现随意生活化电影感，暖橙金调，动作松弛但形体挺拔。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像，100%还原。男性挺拔，女性优美。新郎短发，严禁长发、佝偻、小眼睛、日本脸特征。

二、造型细节（与本风格全套保持统一）

新娘：一字肩香槟色叠层纱裙，侧边大波浪编发，金色发饰，碎钻项链，低饱和奶茶色妆容。

新郎：米色西装，浅杏色马甲，复古印花丝巾，精钢腕表，黑色利落短发。

三、场景与画质

场景：消色处理后的暖调草地，复古行李箱皮质清晰。画面色块平衡，面部无油光，严禁过曝。

Negative Prompt: vibrant green, overexposed skin, oily face, slouching posture, dull eyes, long hair for groom.

四、分镜动作

Wide cinematic shot. The couple sits casually on the grass, leaning against a large vintage suitcase. The bride laughs with her head slightly tilted; the groom looks at her with a happy smile. --ar 16:9`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：电影宽银幕（16:9）。展现随意生活化电影感，暖橙金调，动作松弛但形体挺拔。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像，100%还原。男性挺拔，女性优美。新郎短发，严禁长发、佝偻、小眼睛、日本脸特征。 二、造型细节（与本风格全套保持统一） 新娘：一字肩香槟色叠层纱裙，侧边大波浪编发，金色发饰，碎钻项链，低饱和奶茶色妆容。 新郎：米色西装，浅杏色马甲，复古印花丝巾，精钢腕表，黑色利落短发。 三、场景与画质 场景：消色处理后的暖调草地，复古行李箱皮质清晰。画面色块平衡，面部无油光，严禁过曝。 Negative Prompt: vibrant green, overexposed skin, oily face, slouching posture, dull eyes, long hair for groom. 四、分镜动作 Wide cinematic shot. The couple sits casually on the grass, leaning against a large vintage suitcase. The bride laughs with her head slightly tilted; the groom looks at her with a happy smile. --ar 16:9`,
        aspectRatio: "16:9",
        scene: "黄金时刻梦幻风",
        pose: "D",
        styleTags: []
      },
      {
        name: "E",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：电影宽银幕（16:9）。利用大光圈营造空间纵深，体现人物前后跨度与金色森林光芒。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像。男性为唯一新郎，女性为唯一新娘。男性身姿挺拔，女性修长，男性明显高于女性。新郎短发，严禁长发与佝偻。

二、造型细节（与本风格全套保持统一）

新娘：大蓬松香槟色叠层纱裙，侧边大波浪编发，金色发饰，温润妆容，碎钻项链。

新郎：米色西装，浅杏色马甲，复古印花丝巾，精钢腕表，黑色短发。

三、场景与画质

场景：森林纵深感，太阳光从森林深处穿透，前后错位站位。梦幻光斑，面部哑光，画面不过曝。

Negative Prompt: high saturation green, oily face, stiff posture, overexposed highlights, slouching, long hair.

四、分镜动作

Cinematic depth of field. The bride sits on a dark bench in the foreground, looking back with a joyful smile. The groom stands several meters behind, tall and upright, leaning lightly against a tree with the suitcase. --ar 16:9`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：电影宽银幕（16:9）。利用大光圈营造空间纵深，体现人物前后跨度与金色森林光芒。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像。男性为唯一新郎，女性为唯一新娘。男性身姿挺拔，女性修长，男性明显高于女性。新郎短发，严禁长发与佝偻。 二、造型细节（与本风格全套保持统一） 新娘：大蓬松香槟色叠层纱裙，侧边大波浪编发，金色发饰，温润妆容，碎钻项链。 新郎：米色西装，浅杏色马甲，复古印花丝巾，精钢腕表，黑色短发。 三、场景与画质 场景：森林纵深感，太阳光从森林深处穿透，前后错位站位。梦幻光斑，面部哑光，画面不过曝。 Negative Prompt: high saturation green, oily face, stiff posture, overexposed highlights, slouching, long hair. 四、分镜动作 Cinematic depth of field. The bride sits on a dark bench in the foreground, looking back with a joyful smile. The groom stands several meters behind, tall and upright, leaning lightly against a tree with the suitcase. --ar 16:9`,
        aspectRatio: "16:9",
        scene: "黄金时刻梦幻风",
        pose: "E",
        styleTags: []
      },
      {
        name: "F",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。捕捉服饰纹理与人物随和的互动瞬间，突出温暖幸福感。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像，100%还原。身材比例自然，女性曲线优雅，男性挺拔。新郎黑色短发，严禁长发、小眼睛、日本脸特征。

二、造型细节（与本风格全套保持统一）

新娘：香槟色叠层纱裙，侧边大波浪编发，金色发饰，碎钻项链。

新郎：米色西装，浅杏色马甲，复古印花丝巾，精钢腕表，袖口微卷。

三、场景与画质

场景：逆光森林，背景虚化。侧逆光勾勒背部与颈部曲线，皮肤温润哑光。

Negative Prompt: vibrant green, overexposed skin, oily face, slouching posture, dull eyes, long hair for groom.

四、分镜动作

Medium shot. The groom gently wipes a strand of hair from the bride's face; they both smile amiably. Backlighting highlights the tulle dress and the metallic sheen of the groom's watch. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。捕捉服饰纹理与人物随和的互动瞬间，突出温暖幸福感。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像，100%还原。身材比例自然，女性曲线优雅，男性挺拔。新郎黑色短发，严禁长发、小眼睛、日本脸特征。 二、造型细节（与本风格全套保持统一） 新娘：香槟色叠层纱裙，侧边大波浪编发，金色发饰，碎钻项链。 新郎：米色西装，浅杏色马甲，复古印花丝巾，精钢腕表，袖口微卷。 三、场景与画质 场景：逆光森林，背景虚化。侧逆光勾勒背部与颈部曲线，皮肤温润哑光。 Negative Prompt: vibrant green, overexposed skin, oily face, slouching posture, dull eyes, long hair for groom. 四、分镜动作 Medium shot. The groom gently wipes a strand of hair from the bride's face; they both smile amiably. Backlighting highlights the tulle dress and the metallic sheen of the groom's watch. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "黄金时刻梦幻风",
        pose: "F",
        styleTags: []
      },
      {
        name: "G",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清横构图（3:2）。黄金时刻梦幻风收束合影，金色雾气、暖咖植被、人物三分之四侧身，不得纯背影。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像。男性为新郎，女性为新娘。男性身形挺拔，女性身形优雅。新郎短发，男性明显高于女性。

二、造型细节（与本风格全套保持统一）

新娘：大蓬松香槟色叠层纱裙，金色发饰，侧边大波浪编发，阳光温润妆容。

新郎：米色西装套装，浅杏色马甲，复古印花丝巾，精钢腕表，黑色利落短发。

三、场景与画质

场景：森林尽头，金色雾气缭绕。植被统一为低饱和暖咖色。4K电影质感，面部无油光，严禁过曝。

Negative Prompt: 画面死白、面部泛油、模特佝偻驼背、表情无神木讷、背景过绿、过曝丢失细节、男士长发。

四、分镜动作

Full body shot from a side angle. The couple walks slowly into the golden mist, turning slightly toward each other and smiling happily. Their silhouettes are sharp, upright, and graceful. --ar 3:2

━━━━━━━━━━━━━━━━━━━━`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清横构图（3:2）。黄金时刻梦幻风收束合影，金色雾气、暖咖植被、人物三分之四侧身，不得纯背影。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像。男性为新郎，女性为新娘。男性身形挺拔，女性身形优雅。新郎短发，男性明显高于女性。 二、造型细节（与本风格全套保持统一） 新娘：大蓬松香槟色叠层纱裙，金色发饰，侧边大波浪编发，阳光温润妆容。 新郎：米色西装套装，浅杏色马甲，复古印花丝巾，精钢腕表，黑色利落短发。 三、场景与画质 场景：森林尽头，金色雾气缭绕。植被统一为低饱和暖咖色。4K电影质感，面部无油光，严禁过曝。 Negative Prompt: 画面死白、面部泛油、模特佝偻驼背、表情无神木讷、背景过绿、过曝丢失细节、男士长发。 四、分镜动作 Full body shot from a side angle. The couple walks slowly into the golden mist, turning slightly toward each other and smiling happily. Their silhouettes are sharp, upright, and graceful. --ar 3:2 ━━━━━━━━━━━━━━━━━━━━`,
        aspectRatio: "3:2",
        scene: "黄金时刻梦幻风",
        pose: "G",
        styleTags: []
      },
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
        prompt: ``,
        rawPrompt: ``,
        aspectRatio: "3:4",
        scene: "江南园林",
        pose: "A",
        styleTags: []
      },
      {
        name: "B",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。江南园林新娘单人照，低饱和灰绿调，柔和逆光，突出蕾丝、珍珠与温婉妆容。

一、人物绑定（最高优先级）

人物：仅出现女性，新娘单人。严格使用上传的新娘肖像，100%还原。新娘身形纤细高挑，肩颈舒展，严禁缩脖、耸肩、佝偻。

二、造型细节（与本风格全套保持统一）

新娘：黑色低位发髻，蕾丝长头纱，象牙白法式鱼尾婚纱，珍珠垂坠耳环，正红色丝绒唇妆，皮肤纹理真实哑光。

新郎：本张为新娘单人照，新郎不出现。

三、场景与画质

场景：江南园林白墙黛瓦与雕花木窗，低饱和灰绿调，柔和逆光，无高光死白，保留细节。

Negative Prompt: no groom, third person, overexposed, oily skin, shiny face, greasy forehead, blown-out highlights, slouching, blurred face, vibrant green background, modern buildings.

四、分镜动作

Medium close-up shot. The bride stands beside a traditional flower-patterned window, gently touching her pearl earring and looking down with a shy happy smile. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。江南园林新娘单人照，低饱和灰绿调，柔和逆光，突出蕾丝、珍珠与温婉妆容。 一、人物绑定（最高优先级） 人物：仅出现女性，新娘单人。严格使用上传的新娘肖像，100%还原。新娘身形纤细高挑，肩颈舒展，严禁缩脖、耸肩、佝偻。 二、造型细节（与本风格全套保持统一） 新娘：黑色低位发髻，蕾丝长头纱，象牙白法式鱼尾婚纱，珍珠垂坠耳环，正红色丝绒唇妆，皮肤纹理真实哑光。 新郎：本张为新娘单人照，新郎不出现。 三、场景与画质 场景：江南园林白墙黛瓦与雕花木窗，低饱和灰绿调，柔和逆光，无高光死白，保留细节。 Negative Prompt: no groom, third person, overexposed, oily skin, shiny face, greasy forehead, blown-out highlights, slouching, blurred face, vibrant green background, modern buildings. 四、分镜动作 Medium close-up shot. The bride stands beside a traditional flower-patterned window, gently touching her pearl earring and looking down with a shy happy smile. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "江南园林",
        pose: "B",
        styleTags: []
      },
      {
        name: "C",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。江南园林新郎单人照，清冷通透，展现黑色燕尾服与精英气质。

一、人物绑定（最高优先级）

人物：仅出现男性，新郎单人。严格使用上传的新郎肖像，100%还原。男性身高约180cm，身形挺拔，眼神聚焦，严禁长发、小眼睛、日本脸特征、佝偻。

二、造型细节（与本风格全套保持统一）

新郎：黑色短背头，黑色燕尾服礼服，羊毛纤维纹理清晰，白色衬衫，黑色领结，妆容干净自然哑光。

新娘：本张为新郎单人照，新娘不出现。

三、场景与画质

场景：江南园林白墙黛瓦、深色木质雕花窗。清冷通透色调，面部温润哑光。

Negative Prompt: no bride, third person, no long hair, overexposed, oily skin, shiny face, blurred face, out of focus, expressionless, dull eyes, vibrant green background.

四、分镜动作

Medium portrait shot. The groom stands upright beside the dark wooden corridor, one hand adjusting his bowtie, looking calmly into the lens with a refined smile. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。江南园林新郎单人照，清冷通透，展现黑色燕尾服与精英气质。 一、人物绑定（最高优先级） 人物：仅出现男性，新郎单人。严格使用上传的新郎肖像，100%还原。男性身高约180cm，身形挺拔，眼神聚焦，严禁长发、小眼睛、日本脸特征、佝偻。 二、造型细节（与本风格全套保持统一） 新郎：黑色短背头，黑色燕尾服礼服，羊毛纤维纹理清晰，白色衬衫，黑色领结，妆容干净自然哑光。 新娘：本张为新郎单人照，新娘不出现。 三、场景与画质 场景：江南园林白墙黛瓦、深色木质雕花窗。清冷通透色调，面部温润哑光。 Negative Prompt: no bride, third person, no long hair, overexposed, oily skin, shiny face, blurred face, out of focus, expressionless, dull eyes, vibrant green background. 四、分镜动作 Medium portrait shot. The groom stands upright beside the dark wooden corridor, one hand adjusting his bowtie, looking calmly into the lens with a refined smile. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "江南园林",
        pose: "C",
        styleTags: []
      },
      {
        name: "D",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：电影宽银幕（16:9）。强制全景深，展现中式长廊透视纵深，确保前后两人五官均清晰锐利。

一、人物绑定（最高优先级）

人物：双人合影。肖像100%还原，维持新郎精英气质与新娘高挑比例。新郎黑色短背头，严禁长发、佝偻、小眼睛、日本脸特征。

二、造型细节（与本风格全套保持统一）

新娘：黑色低位发髻，2米蕾丝长头纱拖地，象牙白鱼尾婚纱，珍珠耳饰，正红丝绒唇。

新郎：黑色短背头，黑色燕尾服礼服，羊毛纤维纹理清晰。

三、场景与画质

场景：深色木质雕花长廊，透视感极强。清冷通透色调，面部温润哑光。

Negative Prompt: overexposed, oily skin, shiny face, greasy forehead, blown-out highlights, slouching, hunchback, blurred face, out of focus, third person, long hair.

四、分镜动作

Cinematic deep focus shot in a long wooden corridor with carved windows. The bride is in the foreground, looking back with a joyful smile, while the groom stands several meters behind, also sharp and clear. --ar 16:9`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：电影宽银幕（16:9）。强制全景深，展现中式长廊透视纵深，确保前后两人五官均清晰锐利。 一、人物绑定（最高优先级） 人物：双人合影。肖像100%还原，维持新郎精英气质与新娘高挑比例。新郎黑色短背头，严禁长发、佝偻、小眼睛、日本脸特征。 二、造型细节（与本风格全套保持统一） 新娘：黑色低位发髻，2米蕾丝长头纱拖地，象牙白鱼尾婚纱，珍珠耳饰，正红丝绒唇。 新郎：黑色短背头，黑色燕尾服礼服，羊毛纤维纹理清晰。 三、场景与画质 场景：深色木质雕花长廊，透视感极强。清冷通透色调，面部温润哑光。 Negative Prompt: overexposed, oily skin, shiny face, greasy forehead, blown-out highlights, slouching, hunchback, blurred face, out of focus, third person, long hair. 四、分镜动作 Cinematic deep focus shot in a long wooden corridor with carved windows. The bride is in the foreground, looking back with a joyful smile, while the groom stands several meters behind, also sharp and clear. --ar 16:9`,
        aspectRatio: "16:9",
        scene: "江南园林",
        pose: "D",
        styleTags: []
      },
      {
        name: "E",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：电影宽银幕（16:9）。园林石桥合影，宁静雅致，人物为正面或三分之四侧身，不得纯背影。

一、人物绑定（最高优先级）

人物：双人合影。远景中维持形体挺拔，严禁由于动作放松导致佝偻。肖像100%还原，新郎身高优势明显，黑色短背头。

二、造型细节（与本风格全套保持统一）

新娘：鱼尾婚纱裙摆自然铺在青石桥面，长头纱轻微飘逸，珍珠耳饰与红唇保持一致。

新郎：黑色燕尾服，黑色短背头，礼服轮廓挺括。

三、场景与画质

场景：园林石桥，周围环绕古树与湖石假山，低饱和灰绿调。电影胶片质感，环境层次丰富，画面无过曝死白。

Negative Prompt: no pure back view, overexposed, oily skin, shiny face, slouching, hunchback, blurred face, vibrant green background, long hair for groom.

四、分镜动作

Wide cinematic shot. The couple stands on a small stone bridge, leaning gently toward each other in three-quarter profile, looking at the water and rockeries with peaceful smiles. --ar 16:9`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：电影宽银幕（16:9）。园林石桥合影，宁静雅致，人物为正面或三分之四侧身，不得纯背影。 一、人物绑定（最高优先级） 人物：双人合影。远景中维持形体挺拔，严禁由于动作放松导致佝偻。肖像100%还原，新郎身高优势明显，黑色短背头。 二、造型细节（与本风格全套保持统一） 新娘：鱼尾婚纱裙摆自然铺在青石桥面，长头纱轻微飘逸，珍珠耳饰与红唇保持一致。 新郎：黑色燕尾服，黑色短背头，礼服轮廓挺括。 三、场景与画质 场景：园林石桥，周围环绕古树与湖石假山，低饱和灰绿调。电影胶片质感，环境层次丰富，画面无过曝死白。 Negative Prompt: no pure back view, overexposed, oily skin, shiny face, slouching, hunchback, blurred face, vibrant green background, long hair for groom. 四、分镜动作 Wide cinematic shot. The couple stands on a small stone bridge, leaning gently toward each other in three-quarter profile, looking at the water and rockeries with peaceful smiles. --ar 16:9`,
        aspectRatio: "16:9",
        scene: "江南园林",
        pose: "E",
        styleTags: []
      },
      {
        name: "F",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。利用月洞门作为天然画框，展示新娘法式鱼尾婚纱的完整裙摆与新郎挺拔形体。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像，男性身高约180cm且明显高于女性，身形挺拔，严禁佝偻。新郎短背头，严禁长发。

二、造型细节（与本风格全套保持统一）

新娘：黑色低位发髻配蕾丝长头纱，象牙白鱼尾婚纱，珍珠垂坠耳环，正红丝绒唇。

新郎：黑色短背头，黑色燕尾服礼服，羊毛纹理清晰。

三、场景与画质

江南园林白墙黛瓦，低饱和灰绿调，电影胶片质感。面部哑光，无油光过曝。

Negative Prompt: overexposed, oily skin, shiny face, greasy forehead, blown-out highlights, slouching, hunchback, blurred face, modern buildings, long hair.

四、分镜动作

Full body shot. The romantic couple stands behind a traditional Chinese Moon Gate. The bride gently holds her bouquet at waist level, and the groom stands beside her with an upright posture. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。利用月洞门作为天然画框，展示新娘法式鱼尾婚纱的完整裙摆与新郎挺拔形体。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像，男性身高约180cm且明显高于女性，身形挺拔，严禁佝偻。新郎短背头，严禁长发。 二、造型细节（与本风格全套保持统一） 新娘：黑色低位发髻配蕾丝长头纱，象牙白鱼尾婚纱，珍珠垂坠耳环，正红丝绒唇。 新郎：黑色短背头，黑色燕尾服礼服，羊毛纹理清晰。 三、场景与画质 江南园林白墙黛瓦，低饱和灰绿调，电影胶片质感。面部哑光，无油光过曝。 Negative Prompt: overexposed, oily skin, shiny face, greasy forehead, blown-out highlights, slouching, hunchback, blurred face, modern buildings, long hair. 四、分镜动作 Full body shot. The romantic couple stands behind a traditional Chinese Moon Gate. The bride gently holds her bouquet at waist level, and the groom stands beside her with an upright posture. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "江南园林",
        pose: "F",
        styleTags: []
      },
      {
        name: "G",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清横构图（3:2）。自然随意的江南园林互动合影，体现愉悦心情与宁静雅致氛围。

一、人物绑定（最高优先级）

人物：双人合影。严格锁定肖像。双人侧身相对或三分之四面向镜头，比例自然。新娘身形纤细高挑，新郎短发挺拔，严禁纯背影、长发、佝偻。

二、造型细节（与本风格全套保持统一）

新娘：手持极简色调花束，黑色低位发髻，蕾丝长头纱，象牙白鱼尾婚纱，温婉哑光妆容。

新郎：黑色短背头，黑色燕尾服，剪裁挺括，细节质感真实。

三、场景与画质

场景：中式园林雕花木质花窗前。柔和自然光，主色调低饱和灰绿，画面宁静高雅。

Negative Prompt: overexposed, oily skin, shiny face, greasy forehead, blown-out highlights, slouching, blurred face, expressionless, vibrant green background, long hair.

四、分镜动作

The couple leans casually against a traditional flower-patterned window. The bride laughs softly, and the groom whispers near her ear while holding her hand. Both faces remain visible and natural. --ar 3:2

━━━━━━━━━━━━━━━━━━━━`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清横构图（3:2）。自然随意的江南园林互动合影，体现愉悦心情与宁静雅致氛围。 一、人物绑定（最高优先级） 人物：双人合影。严格锁定肖像。双人侧身相对或三分之四面向镜头，比例自然。新娘身形纤细高挑，新郎短发挺拔，严禁纯背影、长发、佝偻。 二、造型细节（与本风格全套保持统一） 新娘：手持极简色调花束，黑色低位发髻，蕾丝长头纱，象牙白鱼尾婚纱，温婉哑光妆容。 新郎：黑色短背头，黑色燕尾服，剪裁挺括，细节质感真实。 三、场景与画质 场景：中式园林雕花木质花窗前。柔和自然光，主色调低饱和灰绿，画面宁静高雅。 Negative Prompt: overexposed, oily skin, shiny face, greasy forehead, blown-out highlights, slouching, blurred face, expressionless, vibrant green background, long hair. 四、分镜动作 The couple leans casually against a traditional flower-patterned window. The bride laughs softly, and the groom whispers near her ear while holding her hand. Both faces remain visible and natural. --ar 3:2 ━━━━━━━━━━━━━━━━━━━━`,
        aspectRatio: "3:2",
        scene: "江南园林",
        pose: "G",
        styleTags: []
      },
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
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。复古古堡风（Gothic Castle Aesthetic）结合时尚画报质感。中心构图，以女生为核心。冷咖色与米色的高级色调，保留细腻的颗粒感与画报杂志的精致纹理。

一、人物绑定（最高优先级）

人物：严格使用您上传的肖像。女性为核心（酷飒放松），男性为背景（沉稳放松）。男性身形挺拔直立（180cm），女性形体修长优雅。双人同框比例自然，严禁佝偻，严禁由于动作放松导致的驼背。

肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。新郎眼神需英俊深邃，严禁小眼睛或日本脸特征。

二、造型细节

新娘：黑色长发盘发，妆容为浓艳红唇配精致眼妆；戴黑色墨镜，神情酷飒。身着白色抹胸蕾丝鱼尾婚纱，佩戴长款通透头纱与蕾丝手套。形体展现极佳的曲线感。

新郎：黑色短发，纹理分明；妆容清透自然；戴黑色墨镜。身着白色西装外套、黑色西裤配领结，展现出时尚且沉稳的绅士气质。

三、场景与画质

场景：复古古堡庭院，含木门、石墙与消色处理后的绿植。一台米色车辆停在中央，车身漆面质感清晰。

光影与画质：柔和自然光，面部补光均匀，呈现温润哑光感。主体对焦清晰，画面质感细腻。Negative Prompt: no overexposure, no oily skin, no shiny forehead, no slouching, no hunchback, no Japanese facial features, no small eyes, no vibrant green.

四、分镜动作

Full body shot, centered on the bride. The bride is leaning coolly against the beige car body, one hand touching her head, red lips slightly curled in a confident smile. The groom stands in the background with hands in pockets, looking steady and relaxed. Cinematic editorial style. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。复古古堡风（Gothic Castle Aesthetic）结合时尚画报质感。中心构图，以女生为核心。冷咖色与米色的高级色调，保留细腻的颗粒感与画报杂志的精致纹理。 一、人物绑定（最高优先级） 人物：严格使用您上传的肖像。女性为核心（酷飒放松），男性为背景（沉稳放松）。男性身形挺拔直立（180cm），女性形体修长优雅。双人同框比例自然，严禁佝偻，严禁由于动作放松导致的驼背。 肖像保真：100%沿用原图五官、脸型、肤色，禁止修改。新郎眼神需英俊深邃，严禁小眼睛或日本脸特征。 二、造型细节 新娘：黑色长发盘发，妆容为浓艳红唇配精致眼妆；戴黑色墨镜，神情酷飒。身着白色抹胸蕾丝鱼尾婚纱，佩戴长款通透头纱与蕾丝手套。形体展现极佳的曲线感。 新郎：黑色短发，纹理分明；妆容清透自然；戴黑色墨镜。身着白色西装外套、黑色西裤配领结，展现出时尚且沉稳的绅士气质。 三、场景与画质 场景：复古古堡庭院，含木门、石墙与消色处理后的绿植。一台米色车辆停在中央，车身漆面质感清晰。 光影与画质：柔和自然光，面部补光均匀，呈现温润哑光感。主体对焦清晰，画面质感细腻。Negative Prompt: no overexposure, no oily skin, no shiny forehead, no slouching, no hunchback, no Japanese facial features, no small eyes, no vibrant green. 四、分镜动作 Full body shot, centered on the bride. The bride is leaning coolly against the beige car body, one hand touching her head, red lips slightly curled in a confident smile. The groom stands in the background with hands in pockets, looking steady and relaxed. Cinematic editorial style. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "古堡画报·时尚逃离",
        pose: "A",
        styleTags: []
      },
      {
        name: "B",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。古堡画报风新娘单人照，复古古堡美学结合时尚大片质感，冷咖色与米色高级色调。

一、人物绑定（最高优先级）

人物：仅出现女性，新娘单人。严格使用上传的新娘肖像，100%沿用原图五官、脸型、肤色。女性为核心，酷飒放松，形体修长优雅，严禁佝偻。

二、造型细节（与本风格全套保持统一）

新娘：黑色盘发，浓艳红唇与精致眼妆，黑色墨镜，白色抹胸蕾丝鱼尾婚纱，长款通透头纱，蕾丝手套。

新郎：本张为新娘单人照，新郎不出现。

三、场景与画质

场景：复古古堡庭院，木门、石墙、米色车辆。柔和自然光，面部补光均匀，温润哑光，画报颗粒质感。

Negative Prompt: no groom, no third person, no overexposure, no oily skin, no shiny forehead, no slouching, no vibrant green.

四、分镜动作

Full body fashion shot. The bride leans coolly against the beige car body, one hand touching her sunglasses, red lips slightly curled in a confident smile. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。古堡画报风新娘单人照，复古古堡美学结合时尚大片质感，冷咖色与米色高级色调。 一、人物绑定（最高优先级） 人物：仅出现女性，新娘单人。严格使用上传的新娘肖像，100%沿用原图五官、脸型、肤色。女性为核心，酷飒放松，形体修长优雅，严禁佝偻。 二、造型细节（与本风格全套保持统一） 新娘：黑色盘发，浓艳红唇与精致眼妆，黑色墨镜，白色抹胸蕾丝鱼尾婚纱，长款通透头纱，蕾丝手套。 新郎：本张为新娘单人照，新郎不出现。 三、场景与画质 场景：复古古堡庭院，木门、石墙、米色车辆。柔和自然光，面部补光均匀，温润哑光，画报颗粒质感。 Negative Prompt: no groom, no third person, no overexposure, no oily skin, no shiny forehead, no slouching, no vibrant green. 四、分镜动作 Full body fashion shot. The bride leans coolly against the beige car body, one hand touching her sunglasses, red lips slightly curled in a confident smile. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "古堡画报·时尚逃离",
        pose: "B",
        styleTags: []
      },
      {
        name: "C",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。古堡画报风新郎单人照，白色西装与黑色西裤形成高级撞色，沉稳时尚。

一、人物绑定（最高优先级）

人物：仅出现男性，新郎单人。严格使用上传新郎肖像，100%还原。新郎英俊深邃，身形挺拔直立，严禁小眼睛、日本脸特征、长发、佝偻。

二、造型细节（与本风格全套保持统一）

新郎：黑色利落短发，戴黑色墨镜，白色西装外套，黑色西裤，黑色领结，妆容清透自然，面部哑光。

新娘：本张为新郎单人照，新娘不出现。

三、场景与画质

场景：古堡石墙、厚重木门与米色车辆。柔和自然光，西装羊毛质感分明，墨镜反射古堡光影。

Negative Prompt: no bride, no third person, no long hair, no overexposure, no oily skin, no small eyes for groom, no Japanese facial features, no hunchback.

四、分镜动作

Medium full portrait. The groom stands beside the castle's heavy wooden door, hands in pockets, looking into the lens through black sunglasses with a steady relaxed expression. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。古堡画报风新郎单人照，白色西装与黑色西裤形成高级撞色，沉稳时尚。 一、人物绑定（最高优先级） 人物：仅出现男性，新郎单人。严格使用上传新郎肖像，100%还原。新郎英俊深邃，身形挺拔直立，严禁小眼睛、日本脸特征、长发、佝偻。 二、造型细节（与本风格全套保持统一） 新郎：黑色利落短发，戴黑色墨镜，白色西装外套，黑色西裤，黑色领结，妆容清透自然，面部哑光。 新娘：本张为新郎单人照，新娘不出现。 三、场景与画质 场景：古堡石墙、厚重木门与米色车辆。柔和自然光，西装羊毛质感分明，墨镜反射古堡光影。 Negative Prompt: no bride, no third person, no long hair, no overexposure, no oily skin, no small eyes for groom, no Japanese facial features, no hunchback. 四、分镜动作 Medium full portrait. The groom stands beside the castle's heavy wooden door, hands in pockets, looking into the lens through black sunglasses with a steady relaxed expression. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "古堡画报·时尚逃离",
        pose: "C",
        styleTags: []
      },
      {
        name: "D",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：电影宽银幕（16:9）。利用全景深展现古堡庭院与车辆前后纵深，前后人物五官及墨镜质感全部清晰。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像。新娘表情酷飒放松，新郎沉稳。形体直立，严禁佝偻。新郎黑色利落短发，拒绝长发、小眼睛、日本脸特征。

二、造型细节（与本风格全套保持统一）

新娘：白色蕾丝鱼尾婚纱，长款头纱，蕾丝手套，浓艳红唇，黑色墨镜。

新郎：白色西装外套配黑西裤，黑色短发，黑色墨镜，黑色领结。

三、场景与画质

场景：古堡石墙延伸线与米色车辆。全景深清晰，所有人五官及服饰纹理锐利，面部温润哑光。

Negative Prompt: blurred face, out of focus, overexposed highlights, greasy skin, no hunchback, no expressionless face, no small eyes for groom, no long hair.

四、分镜动作

Cinematic deep focus shot. The bride leans against the front of the beige car in the foreground, looking coolly into the lens. The groom stands several meters behind by the castle door, also sharp and steady. --ar 16:9`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：电影宽银幕（16:9）。利用全景深展现古堡庭院与车辆前后纵深，前后人物五官及墨镜质感全部清晰。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像。新娘表情酷飒放松，新郎沉稳。形体直立，严禁佝偻。新郎黑色利落短发，拒绝长发、小眼睛、日本脸特征。 二、造型细节（与本风格全套保持统一） 新娘：白色蕾丝鱼尾婚纱，长款头纱，蕾丝手套，浓艳红唇，黑色墨镜。 新郎：白色西装外套配黑西裤，黑色短发，黑色墨镜，黑色领结。 三、场景与画质 场景：古堡石墙延伸线与米色车辆。全景深清晰，所有人五官及服饰纹理锐利，面部温润哑光。 Negative Prompt: blurred face, out of focus, overexposed highlights, greasy skin, no hunchback, no expressionless face, no small eyes for groom, no long hair. 四、分镜动作 Cinematic deep focus shot. The bride leans against the front of the beige car in the foreground, looking coolly into the lens. The groom stands several meters behind by the castle door, also sharp and steady. --ar 16:9`,
        aspectRatio: "16:9",
        scene: "古堡画报·时尚逃离",
        pose: "D",
        styleTags: []
      },
      {
        name: "E",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：电影宽银幕（16:9）。随意互动瞬间，强调时尚大片的叙事张力与光影对比。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像。男性身形挺拔直立，女性形体展现S形曲线。动作随性放松但不佝偻。新郎短发，拒绝长发、小眼睛、日本脸特征。

二、造型细节（与本风格全套保持统一）

新娘：白色抹胸蕾丝鱼尾婚纱，长款头纱，黑色墨镜，蕾丝手套，浓艳红唇。

新郎：白色西装外套，黑色西裤，黑色领结，黑色利落短发，黑色墨镜。

三、场景与画质

场景：古堡庭院、米色车辆，非对称构图。质感细腻，写实逼真，面部无油光，杜绝死白过曝。

Negative Prompt: overexposed highlights, greasy skin, hunchback, no Japanese style, no small eyes for groom, no blurred face, no long hair.

四、分镜动作

Wide cinematic shot. The couple stands by the beige vintage car. The bride adjusts her veil with a joyful yet cool expression, while the groom leans lightly against the car door, smiling amiably. --ar 16:9`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：电影宽银幕（16:9）。随意互动瞬间，强调时尚大片的叙事张力与光影对比。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像。男性身形挺拔直立，女性形体展现S形曲线。动作随性放松但不佝偻。新郎短发，拒绝长发、小眼睛、日本脸特征。 二、造型细节（与本风格全套保持统一） 新娘：白色抹胸蕾丝鱼尾婚纱，长款头纱，黑色墨镜，蕾丝手套，浓艳红唇。 新郎：白色西装外套，黑色西裤，黑色领结，黑色利落短发，黑色墨镜。 三、场景与画质 场景：古堡庭院、米色车辆，非对称构图。质感细腻，写实逼真，面部无油光，杜绝死白过曝。 Negative Prompt: overexposed highlights, greasy skin, hunchback, no Japanese style, no small eyes for groom, no blurred face, no long hair. 四、分镜动作 Wide cinematic shot. The couple stands by the beige vintage car. The bride adjusts her veil with a joyful yet cool expression, while the groom leans lightly against the car door, smiling amiably. --ar 16:9`,
        aspectRatio: "16:9",
        scene: "古堡画报·时尚逃离",
        pose: "E",
        styleTags: []
      },
      {
        name: "F",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。专业人像摄影，捕捉酷飒表情与高质感妆容细节，强调时尚画报冲击力。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像。新娘为视觉重心，红唇微扬，神态放松且极具张力。新郎作为陪衬，保持笔挺身姿，短发，严禁长发。

二、造型细节（与本风格全套保持统一）

新娘：鱼尾婚纱蕾丝纹理、蕾丝手套网格、珍珠配饰珠光清晰，浓艳红唇丝绒质感。

新郎：白色西装面料细节可见，黑色领结端正，黑色利落短发，墨镜反射古堡庭院光影。

三、场景与画质

场景：古堡装饰桌椅旁。柔和自然光，面部高级哑光，画面不过曝，严禁油光。

Negative Prompt: shiny forehead, oily face, no overexposure, no slouching, no expressionless face, no Japanese style, no small eyes, no long hair.

四、分镜动作

Medium shot. The bride leans elegantly against a decorated table, looking into the lens with sunglasses pushed down slightly. The groom stands nearby, facing her with a steady gaze. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。专业人像摄影，捕捉酷飒表情与高质感妆容细节，强调时尚画报冲击力。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像。新娘为视觉重心，红唇微扬，神态放松且极具张力。新郎作为陪衬，保持笔挺身姿，短发，严禁长发。 二、造型细节（与本风格全套保持统一） 新娘：鱼尾婚纱蕾丝纹理、蕾丝手套网格、珍珠配饰珠光清晰，浓艳红唇丝绒质感。 新郎：白色西装面料细节可见，黑色领结端正，黑色利落短发，墨镜反射古堡庭院光影。 三、场景与画质 场景：古堡装饰桌椅旁。柔和自然光，面部高级哑光，画面不过曝，严禁油光。 Negative Prompt: shiny forehead, oily face, no overexposure, no slouching, no expressionless face, no Japanese style, no small eyes, no long hair. 四、分镜动作 Medium shot. The bride leans elegantly against a decorated table, looking into the lens with sunglasses pushed down slightly. The groom stands nearby, facing her with a steady gaze. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "古堡画报·时尚逃离",
        pose: "F",
        styleTags: []
      },
      {
        name: "G",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清横构图（3:2）。古堡纪实叙事收束，展现行走间的形体美与酷飒心情，不出现纯背影。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像。男性身形笔挺如青松，女性形体优雅舒展。新郎黑色短发，严禁长发、小眼睛、日本脸特征。

二、造型细节（与本风格全套保持统一）

新娘：白色蕾丝鱼尾婚纱，头纱拖行，蕾丝手套、墨镜、红唇细节精致。

新郎：白色西装外套，黑色西裤，黑色领结，黑色利落短发，身姿笔挺。

三、场景与画质

场景：古堡木门与石墙、米色车辆。4K电影感，光影平衡，皮肤温润哑光，严禁泛油。

Negative Prompt: 画面死白、面部泛油、模特佝偻、表情木讷、日本脸特征、新郎眼睛过小、男士长发、背景过绿。

四、分镜动作

Full body shot from a low perspective. The couple walks slowly from the beige car toward the castle gate in three-quarter profile. The bride looks sideways coolly; the groom walks beside her with confidence. --ar 3:2

━━━━━━━━━━━━━━━━━━━━`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清横构图（3:2）。古堡纪实叙事收束，展现行走间的形体美与酷飒心情，不出现纯背影。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像。男性身形笔挺如青松，女性形体优雅舒展。新郎黑色短发，严禁长发、小眼睛、日本脸特征。 二、造型细节（与本风格全套保持统一） 新娘：白色蕾丝鱼尾婚纱，头纱拖行，蕾丝手套、墨镜、红唇细节精致。 新郎：白色西装外套，黑色西裤，黑色领结，黑色利落短发，身姿笔挺。 三、场景与画质 场景：古堡木门与石墙、米色车辆。4K电影感，光影平衡，皮肤温润哑光，严禁泛油。 Negative Prompt: 画面死白、面部泛油、模特佝偻、表情木讷、日本脸特征、新郎眼睛过小、男士长发、背景过绿。 四、分镜动作 Full body shot from a low perspective. The couple walks slowly from the beige car toward the castle gate in three-quarter profile. The bride looks sideways coolly; the groom walks beside her with confidence. --ar 3:2 ━━━━━━━━━━━━━━━━━━━━`,
        aspectRatio: "3:2",
        scene: "古堡画报·时尚逃离",
        pose: "G",
        styleTags: []
      },
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
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：电影宽银幕（16:9）。捕捉展示婚戒的幸福瞬间，强调手部与面部神态的自然互动，杜绝僵硬感。画面明亮通透。

一、人物绑定（最高优先级）

人物：严格使用上传肖像。男性挺拔俊朗，眼神聚焦；女性纤细优雅。形体保持挺拔直立，严禁形体佝偻。情绪愉快随和。肖像100%还原。

二、造型细节

新娘：象牙白婚纱，珠片细节。韩式低盘发。

新郎：黑色修身礼服西装。黑色利落短发，干净自然。

details：新人面向镜头，同时举起佩戴在无名指上的钻石戒指细节（非拼图，真实呈现手部细节，手部结构正确）。

三、场景与画质

场景：极简浅灰色影棚背景。蝴蝶光。

画质与负面提示：面部呈现高级哑光温润感，杜绝油光。婚纱材质有光泽。Negative Prompt: distorted hands, extra fingers, deformed morphology, shiny face, overexposure, bad proportions, Japanese style, small eyes.

四、分镜动作

Medium shot. The couple stands close, smiling happily and naturally at the lens. They are simultaneously holding up their hands to showcase the wedding rings. Clear detail on the diamond rings. Symmetrical and elegant composition. --ar 16:9`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：电影宽银幕（16:9）。捕捉展示婚戒的幸福瞬间，强调手部与面部神态的自然互动，杜绝僵硬感。画面明亮通透。 一、人物绑定（最高优先级） 人物：严格使用上传肖像。男性挺拔俊朗，眼神聚焦；女性纤细优雅。形体保持挺拔直立，严禁形体佝偻。情绪愉快随和。肖像100%还原。 二、造型细节 新娘：象牙白婚纱，珠片细节。韩式低盘发。 新郎：黑色修身礼服西装。黑色利落短发，干净自然。 details：新人面向镜头，同时举起佩戴在无名指上的钻石戒指细节（非拼图，真实呈现手部细节，手部结构正确）。 三、场景与画质 场景：极简浅灰色影棚背景。蝴蝶光。 画质与负面提示：面部呈现高级哑光温润感，杜绝油光。婚纱材质有光泽。Negative Prompt: distorted hands, extra fingers, deformed morphology, shiny face, overexposure, bad proportions, Japanese style, small eyes. 四、分镜动作 Medium shot. The couple stands close, smiling happily and naturally at the lens. They are simultaneously holding up their hands to showcase the wedding rings. Clear detail on the diamond rings. Symmetrical and elegant composition. --ar 16:9`,
        aspectRatio: "16:9",
        scene: "现代简约",
        pose: "A",
        styleTags: []
      },
      {
        name: "B",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。2015年现代简约新娘单人照，纯净浅灰白影棚，强调精致妆容与配饰细节，暖白通透。

一、人物绑定（最高优先级）

人物：仅出现女性，新娘单人。严格使用上传的新娘肖像，100%沿用原图五官、脸型、肤色。身形纤细优雅，姿态挺拔端庄，严禁缩脖、驼背。

二、造型细节（与本风格全套保持统一）

新娘：黑色韩式优雅低盘发，留碎发丝；精致水钻皇冠与轻薄白色头纱。象牙白一字肩婚纱，珠片刺绣细节清晰。清透裸肌，淡粉腮红，正红色唇妆。

新郎：本张为新娘单人照，新郎不出现。

三、场景与画质

场景：纯净浅灰白影棚背景，蝴蝶光。面部高级哑光温润感，婚纱材质有光泽。

Negative Prompt: no groom, distorted hands, extra fingers, oily skin, overexposure, bad proportions, Japanese style, modern clutter.

四、分镜动作

Medium portrait shot. The bride stands gracefully, gently touching the edge of her veil, looking into the lens with a soft elegant smile. Clear diamond crown and bead embroidery details. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。2015年现代简约新娘单人照，纯净浅灰白影棚，强调精致妆容与配饰细节，暖白通透。 一、人物绑定（最高优先级） 人物：仅出现女性，新娘单人。严格使用上传的新娘肖像，100%沿用原图五官、脸型、肤色。身形纤细优雅，姿态挺拔端庄，严禁缩脖、驼背。 二、造型细节（与本风格全套保持统一） 新娘：黑色韩式优雅低盘发，留碎发丝；精致水钻皇冠与轻薄白色头纱。象牙白一字肩婚纱，珠片刺绣细节清晰。清透裸肌，淡粉腮红，正红色唇妆。 新郎：本张为新娘单人照，新郎不出现。 三、场景与画质 场景：纯净浅灰白影棚背景，蝴蝶光。面部高级哑光温润感，婚纱材质有光泽。 Negative Prompt: no groom, distorted hands, extra fingers, oily skin, overexposure, bad proportions, Japanese style, modern clutter. 四、分镜动作 Medium portrait shot. The bride stands gracefully, gently touching the edge of her veil, looking into the lens with a soft elegant smile. Clear diamond crown and bead embroidery details. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "现代简约",
        pose: "B",
        styleTags: []
      },
      {
        name: "C",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。现代简约新郎单人照，展现儒雅绅士、挺拔俊朗的独立肖像。

一、人物绑定（最高优先级）

人物：唯一新郎单人。四分之三侧身站姿，形体直立严禁驼背。表情沉稳微笑，眼神看向镜头有神聚焦。肖像100%还原，发型为干净利落短发纹理，拒绝日本脸、小眼睛、长发。

二、造型细节（与本风格全套保持统一）

新郎：黑色修身礼服西装，白色衬衫，黑色领结，左胸白玫瑰胸花，银色婚戒细节清晰，手插裤袋。

新娘：本张为新郎单人照，新娘不出现。

三、场景与画质

场景：纯净浅灰白色影棚背景。蝴蝶光。面部高级哑光温润感，西装纤维纹理清晰。

Negative Prompt: no bride, distorted hands, extra fingers, shiny face, overexposure, bad proportions, Japanese style, small eyes, long hair.

四、分镜动作

Medium full shot. The groom stands in a clean grey-white studio, one hand in his pocket and one hand lightly touching the lapel, looking into the camera with a refined smile. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。现代简约新郎单人照，展现儒雅绅士、挺拔俊朗的独立肖像。 一、人物绑定（最高优先级） 人物：唯一新郎单人。四分之三侧身站姿，形体直立严禁驼背。表情沉稳微笑，眼神看向镜头有神聚焦。肖像100%还原，发型为干净利落短发纹理，拒绝日本脸、小眼睛、长发。 二、造型细节（与本风格全套保持统一） 新郎：黑色修身礼服西装，白色衬衫，黑色领结，左胸白玫瑰胸花，银色婚戒细节清晰，手插裤袋。 新娘：本张为新郎单人照，新娘不出现。 三、场景与画质 场景：纯净浅灰白色影棚背景。蝴蝶光。面部高级哑光温润感，西装纤维纹理清晰。 Negative Prompt: no bride, distorted hands, extra fingers, shiny face, overexposure, bad proportions, Japanese style, small eyes, long hair. 四、分镜动作 Medium full shot. The groom stands in a clean grey-white studio, one hand in his pocket and one hand lightly touching the lapel, looking into the camera with a refined smile. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "现代简约",
        pose: "C",
        styleTags: []
      },
      {
        name: "D",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：电影宽银幕（16:9）。利用全景深在影棚背景下构建空间层次，强调背后环抱的亲密感。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像。新郎明显高于新娘。姿态挺拔，新郎从身后环抱新娘时脊柱保持直立，严禁佝偻。新郎短发，拒绝长发、眯眯眼、日本脸特征。

二、造型细节（与本风格全套保持统一）

新娘：象牙白一字肩婚纱，珠片刺绣细节分明，韩式低盘发，水钻皇冠，白色头纱。

新郎：黑色修身礼服西装，白衬衫，黑领结，白玫瑰胸花，干净短发纹理。

三、场景与画质

场景：极简浅灰白影棚。全景深，婚纱刺绣与西装面料全部清晰。面部哑光，画面明亮不过曝。

Negative Prompt: distorted hands, extra fingers, blurred face, oily skin, overexposure, bad proportions, Japanese style, small eyes, long hair.

四、分镜动作

Medium wide shot. The groom embraces the bride from behind around her waist; the bride turns slightly toward the camera with a bright smile. Both faces are sharp and natural. --ar 16:9`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：电影宽银幕（16:9）。利用全景深在影棚背景下构建空间层次，强调背后环抱的亲密感。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像。新郎明显高于新娘。姿态挺拔，新郎从身后环抱新娘时脊柱保持直立，严禁佝偻。新郎短发，拒绝长发、眯眯眼、日本脸特征。 二、造型细节（与本风格全套保持统一） 新娘：象牙白一字肩婚纱，珠片刺绣细节分明，韩式低盘发，水钻皇冠，白色头纱。 新郎：黑色修身礼服西装，白衬衫，黑领结，白玫瑰胸花，干净短发纹理。 三、场景与画质 场景：极简浅灰白影棚。全景深，婚纱刺绣与西装面料全部清晰。面部哑光，画面明亮不过曝。 Negative Prompt: distorted hands, extra fingers, blurred face, oily skin, overexposure, bad proportions, Japanese style, small eyes, long hair. 四、分镜动作 Medium wide shot. The groom embraces the bride from behind around her waist; the bride turns slightly toward the camera with a bright smile. Both faces are sharp and natural. --ar 16:9`,
        aspectRatio: "16:9",
        scene: "现代简约",
        pose: "D",
        styleTags: []
      },
      {
        name: "E",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清横构图（3:2）。现代简约影棚合影，捕捉额头轻触的温柔亲昵瞬间，画面干净高级。

一、人物绑定（最高优先级）

人物：双人合影。两人面对面靠近，额头轻轻相触。神态温馨幸福，形体美感严禁驼背或耸肩。肖像100%还原，新郎英俊短发，非日本脸特征。

二、造型细节（与本风格全套保持统一）

新娘：象牙白一字肩婚纱，水钻皇冠，珍珠或水钻配饰，韩式低盘发，清透妆容。

新郎：黑色修身礼服西装，白衬衫，黑领结，白玫瑰胸花，短发纹理。

三、场景与画质

场景：纯净浅灰白色影棚背景。保留皮肤真实毛孔纹理，面部哑光，背景极简。

Negative Prompt: distorted hands, extra fingers, shiny face, overexposure, bad proportions, Japanese style, small eyes, long hair, stiff posture.

四、分镜动作

Close-up medium shot. The couple stands face-to-face with foreheads gently touching, smiling softly. Their shoulders remain relaxed and upright, both faces visible in profile. --ar 3:2`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清横构图（3:2）。现代简约影棚合影，捕捉额头轻触的温柔亲昵瞬间，画面干净高级。 一、人物绑定（最高优先级） 人物：双人合影。两人面对面靠近，额头轻轻相触。神态温馨幸福，形体美感严禁驼背或耸肩。肖像100%还原，新郎英俊短发，非日本脸特征。 二、造型细节（与本风格全套保持统一） 新娘：象牙白一字肩婚纱，水钻皇冠，珍珠或水钻配饰，韩式低盘发，清透妆容。 新郎：黑色修身礼服西装，白衬衫，黑领结，白玫瑰胸花，短发纹理。 三、场景与画质 场景：纯净浅灰白色影棚背景。保留皮肤真实毛孔纹理，面部哑光，背景极简。 Negative Prompt: distorted hands, extra fingers, shiny face, overexposure, bad proportions, Japanese style, small eyes, long hair, stiff posture. 四、分镜动作 Close-up medium shot. The couple stands face-to-face with foreheads gently touching, smiling softly. Their shoulders remain relaxed and upright, both faces visible in profile. --ar 3:2`,
        aspectRatio: "3:2",
        scene: "现代简约",
        pose: "E",
        styleTags: []
      },
      {
        name: "F",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。现代简约甜蜜合影，突出钻戒、手部结构与自然笑容。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像。男性挺拔俊朗，眼神聚焦；女性纤细优雅。形体保持挺拔直立，情绪愉快随和。新郎短发，严禁长发。

二、造型细节（与本风格全套保持统一）

新娘：象牙白一字肩婚纱，珠片细节，韩式低盘发，水钻皇冠与轻薄头纱。

新郎：黑色修身礼服西装，白衬衫，黑色领结，白玫瑰胸花，短发纹理。

三、场景与画质

场景：极简浅灰色影棚背景。蝴蝶光，手部结构正确，钻戒清晰，面部高级哑光。

Negative Prompt: distorted hands, extra fingers, deformed morphology, shiny face, overexposure, bad proportions, Japanese style, small eyes, long hair.

四、分镜动作

Medium shot. The couple stands close, smiling happily and naturally at the lens. They gently hold their hands together near chest level, showing the wedding rings clearly. --ar 3:4`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。现代简约甜蜜合影，突出钻戒、手部结构与自然笑容。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像。男性挺拔俊朗，眼神聚焦；女性纤细优雅。形体保持挺拔直立，情绪愉快随和。新郎短发，严禁长发。 二、造型细节（与本风格全套保持统一） 新娘：象牙白一字肩婚纱，珠片细节，韩式低盘发，水钻皇冠与轻薄头纱。 新郎：黑色修身礼服西装，白衬衫，黑色领结，白玫瑰胸花，短发纹理。 三、场景与画质 场景：极简浅灰色影棚背景。蝴蝶光，手部结构正确，钻戒清晰，面部高级哑光。 Negative Prompt: distorted hands, extra fingers, deformed morphology, shiny face, overexposure, bad proportions, Japanese style, small eyes, long hair. 四、分镜动作 Medium shot. The couple stands close, smiling happily and naturally at the lens. They gently hold their hands together near chest level, showing the wedding rings clearly. --ar 3:4`,
        aspectRatio: "3:4",
        scene: "现代简约",
        pose: "F",
        styleTags: []
      },
      {
        name: "G",
        prompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真：

核心任务：超高清竖构图（3:4）。现代简约系列收束合影，强调白灰影棚、干净轮廓与温柔仪式感。

一、人物绑定（最高优先级）

人物：双人合影。严格使用上传肖像，100%还原。新郎明显高于新娘，短发挺拔；新娘优雅自然。两人正面或三分之四侧身面对镜头，不得纯背影。

二、造型细节（与本风格全套保持统一）

新娘：象牙白一字肩婚纱，珠片刺绣，韩式低盘发，水钻皇冠，轻薄白头纱，清透裸肌妆。

新郎：黑色修身礼服西装，白衬衫，黑领结，白玫瑰胸花，短发纹理。

三、场景与画质

场景：浅灰白极简影棚，柔和蝴蝶光，4K高清，皮肤纹理真实，面部哑光。

Negative Prompt: no pure back view, distorted hands, extra fingers, oily face, overexposure, bad proportions, Japanese style, small eyes, long hair.

四、分镜动作

Full body studio shot. The bride gently holds the groom's arm while the groom stands upright beside her. Both look into the lens with warm natural smiles, clean symmetrical composition. --ar 3:4

━━━━━━━━━━━━━━━━━━━━`,
        rawPrompt: `以@Image @Image 人物为原型，去除所有背景服饰和发型，再生成写真： 核心任务：超高清竖构图（3:4）。现代简约系列收束合影，强调白灰影棚、干净轮廓与温柔仪式感。 一、人物绑定（最高优先级） 人物：双人合影。严格使用上传肖像，100%还原。新郎明显高于新娘，短发挺拔；新娘优雅自然。两人正面或三分之四侧身面对镜头，不得纯背影。 二、造型细节（与本风格全套保持统一） 新娘：象牙白一字肩婚纱，珠片刺绣，韩式低盘发，水钻皇冠，轻薄白头纱，清透裸肌妆。 新郎：黑色修身礼服西装，白衬衫，黑领结，白玫瑰胸花，短发纹理。 三、场景与画质 场景：浅灰白极简影棚，柔和蝴蝶光，4K高清，皮肤纹理真实，面部哑光。 Negative Prompt: no pure back view, distorted hands, extra fingers, oily face, overexposure, bad proportions, Japanese style, small eyes, long hair. 四、分镜动作 Full body studio shot. The bride gently holds the groom's arm while the groom stands upright beside her. Both look into the lens with warm natural smiles, clean symmetrical composition. --ar 3:4 ━━━━━━━━━━━━━━━━━━━━`,
        aspectRatio: "3:4",
        scene: "现代简约",
        pose: "G",
        styleTags: []
      },
    ]
  }),
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

  // 选中主题：全部 7 张 (A-G)
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
