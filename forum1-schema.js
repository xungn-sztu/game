import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

const clamp = (min, max) => (value) => _.clamp(value, min, max);

const SourceMetaSchema = z.object({
  信息来源: z.string().describe('该信息当前主要来源，例如亲眼所见、论坛爆料、她本人表露'),
  认知状态: z.string().describe('该信息当前属于已知、可推测、未知或未证实'),
  是否已确认: z.boolean().describe('该信息是否已经通过事件或现实互动确认')
}).describe('字段展示级来源与认知状态');

const CharacterSummarySchema = z.object({
  角色名: z.string().describe('状态栏角色页显示的角色名'),
  当前是否在场: z.boolean().describe('该角色当前是否出现在场景中'),
  是否已建档: z.boolean().describe('该角色是否完成建档'),
  公开头衔: z.string().describe('角色在状态栏里显示的公开身份'),
  关系性质: z.string().describe('角色当前关系性质'),
  情感深度: z.string().describe('角色当前情感深度'),
  生活渗透度: z.string().describe('角色与主角生活层面的交织程度'),
  亲密程度: z.string().describe('角色与主角当前身体亲密程度'),
  最近更新: z.string().describe('该角色最近一次摘要刷新说明')
}).describe('角色栏固定摘要');

const CharacterDetailSchema = z.object({
  角色名: z.string().describe('角色名'),
  当前是否在场: z.boolean().describe('该角色当前是否出现在场景中'),
  是否已建档: z.boolean().describe('该角色是否完成建档'),
  信息来源: z.record(z.string(), SourceMetaSchema).optional().describe('关键字段的来源、认知状态与确认标记'),
  现实身份: z.object({
    公开头衔: z.string().describe('角色在现实社会的公开身份'),
    体面维持度: z.coerce.number().transform(clamp(0, 100)).describe('表面体面程度，范围0-100')
  }),
  心理与状态: z.object({
    角色性格: z.string().describe('角色性格特征'),
    心情值: z.string().describe('当前心情状态'),
    认知坐标: z.string().describe('心理认知位置'),
    好感度: z.coerce.number().transform(clamp(-100, 100)).describe('对主角好感度'),
    开放度: z.coerce.number().transform(clamp(0, 100)).describe('开放程度'),
    情感深度: z.string().describe('当前情感深度'),
    变化原因: z.string().optional().describe('近期心理状态变化的主要诱因或触发事件')
  }),
  性向数据: z.object({
    性经验: z.string().describe('角色性经验阶段'),
    性态度: z.string().describe('角色对性与亲密行为的总体态度'),
    性开放程度: z.string().describe('角色在性层面的开放程度'),
    性欲程度: z.string().describe('角色欲望强度'),
    性癖好: z.array(z.string()).describe('角色当前明确的性癖好列表'),
    性癖: z.string().describe('兼容旧字段的主性癖'),
    形态适应度: z.object({
      强制放养: z.coerce.number().transform(clamp(0, 100)).describe('对强制放养类玩法的适应度'),
      当面羞辱: z.coerce.number().transform(clamp(0, 100)).describe('对当面羞辱类玩法的适应度'),
      彻底剥夺: z.coerce.number().transform(clamp(0, 100)).describe('对彻底剥夺类玩法的适应度'),
      极限堕落: z.coerce.number().transform(clamp(0, 100)).describe('对极限堕落类玩法的适应度')
    })
  }),
  社交与从属: z.object({
    认识渠道: z.string().describe('角色与主角的认识渠道'),
    关系性质: z.string().describe('角色当前关系性质'),
    争宠手段: z.string().describe('角色当前会使用的竞争或争宠方式'),
    病态依赖度: z.coerce.number().transform(clamp(0, 100)).describe('角色的病态依赖程度'),
    关系定位: z.string().describe('角色当前关系定位'),
    情感深度: z.string().describe('角色当前情感深度'),
    生活渗透度: z.string().describe('角色与主角生活层面的交织程度')
  }),
  服装: z.record(z.string(), z.string()).describe('角色当前服装信息'),
  身体数据: z.object({
    年龄: z.coerce.number().transform(clamp(18, 100)).describe('角色年龄'),
    身高: z.coerce.number().transform(clamp(100, 250)).describe('角色身高 cm'),
    体重: z.coerce.number().transform(clamp(30, 200)).describe('角色体重 kg'),
    身材类型: z.string().describe('角色身材类型'),
    外观可见特征: z.string().describe('角色最显眼的外观描述'),
    当前观感: z.string().optional().describe('当前阶段从外观看到的整体体态或状态'),
    最近体态变化: z.string().optional().describe('近期因时间或事件导致的体态变化说明'),
    三围: z.string().describe('角色三围'),
    罩杯: z.string().describe('角色罩杯'),
    私处: z.object({
      阴毛: z.string().describe('阴毛状态'),
      阴唇: z.string().describe('阴唇特征'),
      颜色: z.string().describe('私处颜色'),
      双穴状态: z.string().describe('双穴整体状态')
    }),
    身体开发等级: z.enum(['未开发', '初窥门径', '经验丰富', '重度开发', '极限重塑', '清醒肉器']).describe('角色身体开发等级'),
    身体缺陷: z.object({
      必选项: z.record(z.string(), z.string()).describe('稳定存在的身体特征'),
      常见项: z.array(z.string()).describe('常见身体小问题'),
      随机项: z.array(z.string()).describe('随机身体特征')
    }),
    亲密程度: z.string().describe('角色与主角当前身体亲密程度')
  })
}).describe('角色完整详情');

const FixedSummarySlotsSchema = z.object({
  档案1: CharacterSummarySchema,
  档案2: CharacterSummarySchema,
  档案3: CharacterSummarySchema,
  档案4: CharacterSummarySchema
}).describe('固定摘要槽位');

const FixedDetailSlotsSchema = z.object({
  档案1: CharacterDetailSchema,
  档案2: CharacterDetailSchema,
  档案3: CharacterDetailSchema,
  档案4: CharacterDetailSchema
}).describe('固定详情槽位');

export const Schema = z.object({
  世界: z.object({
    时间: z.string().describe('当前时间，如周末深夜、凌晨等'),
    地点: z.string().describe('当前地点，如电脑桌前、注册页等'),
    详细时间: z.object({
      年: z.coerce.number().describe('年份'),
      月: z.coerce.number().describe('月份'),
      日: z.coerce.number().describe('日期'),
      时: z.coerce.number().describe('小时'),
      分: z.coerce.number().describe('分钟'),
      秒: z.coerce.number().describe('秒'),
      星期: z.enum(['周一', '周二', '周三', '周四', '周五', '周六', '周日']).describe('星期')
    })
  }),
  视线内对象: z.record(z.string(), z.object({
    当前观察: z.string().optional().describe('当前一眼看到的短句观察，10-18字左右'),
    面貌: z.string().describe('长什么样'),
    发型发色: z.string().describe('发型和发色'),
    配饰: z.string().describe('佩戴的饰品'),
    上衣: z.string().describe('上衣穿着'),
    下装: z.string().describe('下装穿着')
  })).describe('主角视线范围内的外观描述'),
  主角: z.object({
    年龄: z.coerce.number().transform(clamp(18, 100)).describe('主角年龄'),
    性格: z.string().describe('主角性格描述'),
    金钱: z.coerce.number().transform(clamp(0, 99999999)).describe('主角现金'),
    身体素质: z.enum(['孱弱', '一般', '良好', '优秀', '超凡']).describe('身体素质等级'),
    性经验等级: z.enum(['懵懂', '初涉', '熟练', '老手', '大师']).describe('性经验等级'),
    体力: z.enum(['充沛', '良好', '一般', '疲惫', '力竭']).describe('当前体力状态'),
    勃起状态: z.enum(['未启用', '半勃起', '完全勃起', '充血坚硬']).describe('勃起状态'),
    射精阈值: z.enum(['未启用', '一阶', '二阶', '三阶', '四阶']).describe('射精阈值阶段'),
    身体数据: z.object({
      勃起长度: z.coerce.number().transform(clamp(8, 30)).describe('勃起长度 cm'),
      勃起直径: z.coerce.number().transform(clamp(20, 80)).describe('勃起直径 mm'),
      耐久度: z.coerce.number().transform(clamp(0, 100)).describe('耐久度'),
      敏感度: z.enum(['低', '中等', '高']).describe('敏感度'),
      恢复速度: z.enum(['慢', '较慢', '较快', '快']).describe('恢复速度')
    })
  }),
  角色索引: FixedSummarySlotsSchema,
  角色详情: FixedDetailSlotsSchema,
  女角色档案: FixedDetailSlotsSchema.describe('旧版兼容角色档案容器'),
  暗网论坛: z.object({
    当前分区: z.enum(['约炮区', '淫妻区', '文爱区', '主仆区', '视频图文区', '我的', '炫耀区', '爆料区', '物色区', '交易/服务区']).describe('当前浏览的论坛分区'),
    我的账户: z.object({
      用户名: z.string().describe('论坛用户名'),
      等级: z.string().describe('论坛等级'),
      积分: z.coerce.number().transform(clamp(0, 99999999)).describe('论坛积分'),
      已购黑料: z.record(z.string(), z.object({
        黑料等级: z.enum(['普通', '高级', '绝密']).describe('黑料等级'),
        内容描述: z.string().describe('黑料内容描述')
      })).describe('已购买的黑料'),
      已购服务: z.record(z.string(), z.object({
        服务类型: z.enum(['基础背景调查', '匿名发布', '深度社交网络分析']).describe('服务类型'),
        目标对象: z.string().describe('服务目标角色名'),
        购买时间: z.string().describe('购买时间'),
        是否已使用: z.boolean().describe('是否已使用')
      })).describe('已购买的服务')
    }),
    分区数据: z.record(z.string(), z.object({
      帖子列表: z.record(z.string(), z.object({
        标题: z.string().describe('帖子标题'),
        发帖人: z.string().describe('发帖人用户名'),
        时间: z.string().describe('发帖时间'),
        热度: z.coerce.number().transform(clamp(0, 99999999)).describe('帖子热度'),
        内容摘要: z.string().describe('帖子内容摘要'),
        风格标签: z.string().optional().describe('帖子当前对应的论坛风格标签，如炫耀区、爆料区、物色区、交易/服务区'),
        信息来源: z.string().optional().describe('帖子层信息来源，通常为论坛爆料或匿名转述'),
        可信度: z.string().optional().describe('帖子内容的可信度，例如未证实、片段、亲历实录'),
        帖子ID: z.string().describe('帖子唯一 ID')
      })).describe('该分区的帖子列表'),
      最后刷新时间: z.string().describe('该分区最后刷新时间')
    })).describe('各分区独立帖子数据'),
    服务商店: z.object({
      基础背景调查: z.object({
        价格: z.coerce.number().describe('服务价格'),
        描述: z.string().describe('服务描述'),
        剩余库存: z.coerce.number().describe('今日剩余可购买次数')
      }),
      匿名发布: z.object({
        价格: z.coerce.number().describe('服务价格'),
        描述: z.string().describe('服务描述'),
        剩余库存: z.coerce.number().describe('今日剩余可购买次数')
      }),
      深度社交网络分析: z.object({
        价格: z.coerce.number().describe('服务价格'),
        描述: z.string().describe('服务描述'),
        剩余库存: z.coerce.number().describe('今日剩余可购买次数')
      })
    }).describe('服务商店数据'),
    浏览历史: z.record(z.string(), z.object({
      帖子ID: z.string().describe('帖子 ID'),
      分区: z.string().describe('所属分区'),
      浏览时间: z.string().describe('浏览时间')
    })).describe('帖子浏览历史记录')
  })
});

$(() => {
  registerMvuSchema(Schema);
});
