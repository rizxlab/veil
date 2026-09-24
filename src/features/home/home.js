import { icon } from "../../shared/ui/icons.js";
export function renderHome() {
  return /* HTML */ `<main id="main" class="home page-enter" tabindex="-1">
    <section class="home-intro">
      <span class="intro-star">✧</span>
    </section>
    <section class="portal-grid" aria-label="选择探索方式">
      <a class="portal portal-tarot" href="#/tarot"
        ><div class="portal-art">
          <img
            src="/assets/illustrations/tarot.svg"
            alt="雾紫色塔罗牌与星轨"
            width="360"
            height="250"
          />
        </div>
        <div class="portal-copy">
          <span class="portal-index">01 / TAROT</span>
          <h2>塔罗牌</h2>
          <p>在牌与牌之间，遇见另一种视角。</p>
          <span class="portal-action">开启一次抽牌 ${icon("arrow")}</span>
        </div></a
      ><a class="portal portal-dice" href="#/astro-dice"
        ><div class="portal-art">
          <img
            src="/assets/illustrations/dice.svg"
            alt="三枚浅绿色星骰"
            width="360"
            height="250"
          />
        </div>
        <div class="portal-copy">
          <span class="portal-index">02 / ASTRO DICE</span>
          <h2>星骰</h2>
          <p>星体、星座与宫位，交织此刻的灵感。</p>
          <span class="portal-action quiet">掷一次星骰 ${icon("arrow")}</span>
        </div></a
      ><a class="portal portal-oracle" href="#/oracle"
        ><div class="portal-art">
          <img
            src="/assets/illustrations/oracle.svg"
            alt="暖金色神谕卡与日月"
            width="360"
            height="250"
          />
        </div>
        <div class="portal-copy">
          <span class="portal-index">03 / ORACLE</span>
          <h2>神谕卡</h2>
          <p>接住一份温柔的提示，交给内心解读。</p>
          <span class="portal-action quiet">即将开放 ${icon("arrow")}</span>
        </div></a
      >
    </section>
    <a class="knowledge-link" href="#/knowledge"
      ><span class="knowledge-icon">${icon("book")}</span
      ><span
        ><strong>知识库</strong
        ><small>从一点好奇开始，慢慢认识塔罗与星象。</small></span
      >${icon("arrow")}</a
    >
    <div class="home-bottom">
      <span></span><i>向内探索，自有回响</i><span></span>
    </div>
  </main>`;
}
