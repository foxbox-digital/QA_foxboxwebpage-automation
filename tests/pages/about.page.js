const BasePage = require('./base.page');

class AboutPage extends BasePage {
  constructor(page) {
    super(page);

    // Hero section — redesigned ~Sep 2026: the hero <h1> is now "Aim for indispensable."
    // and the hero subheading ("Staples for them. Growth engines for you.") was removed
    // (its <p> renders empty). Pinned to level 1 because the same phrase also closes the
    // "Who We Are" copy. The intro statement under "Who We Are" is the page's lead copy now.
    this.heroHeading = page.getByRole('heading', { name: /^Aim for indispensable\.?$/i, level: 1 });
    this.introStatement = page.getByText(
      'Foxbox is a digital product agency with deep technical expertise and a clearly defined purpose'
    );

    // Section headings
    this.whoWeAreHeading = page.getByText('WHO WE ARE');
    this.leadershipHeading = page.getByText('Led by Experience');
    this.whyFoxboxHeading = page.getByText('WHY FOXBOX?');
    this.ourCultureLink = page.getByRole('link', { name: /OUR CULTURE/i });
    this.whatWeBelieveHeading = page.getByText('What We Believe');
    this.letsGetThingsDoneHeading = page.getByText("Let's Get Things Done, Together");

    // Leadership team cards
    this.robVolkCard = page.getByText('Rob Volk');
    this.elliottTorresCard = page.getByText('Elliott Torres');
    this.trentEdwardsCard = page.getByText('Trent Edwards');
    this.barrettWillichCard = page.getByText('Barrett Willich');

    // Team member roles (profile schema data) — FOX2-42
    this.robVolkRole = page.getByText('Founder & CEO');
    this.elliottTorresRole = page.getByText(/Chief Technology Officer/i).first();

    // CTA — same pattern as home page; element is not an <a role="link">
    this.chatWithUsButton = page.getByText(/CHAT WITH US/i).first();

    // Newsletter (footer)
    this.newsletterInput = page.getByPlaceholder(/enter your email/i);
    this.newsletterSignUpButton = page.getByRole('button', { name: /SIGN UP/i });
  }

  async open() {
    await this.navigate('/about');
    await this.waitForPageLoad();
  }
}

module.exports = AboutPage;
