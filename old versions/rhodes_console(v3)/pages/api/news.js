import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  try {
    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new'
    });
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Navigate to page and wait for content
    await page.goto('https://www.arknights.global/news', { waitUntil: 'networkidle0' });
    await page.waitForSelector('.news-list');

    // Extract news data
    const newsItems = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('.news-list .news-item').forEach((elem) => {
        const title = elem.querySelector('.news-title')?.textContent?.trim();
        const date = elem.querySelector('.news-date')?.textContent?.trim();
        const link = elem.querySelector('a')?.href;
        const id = link?.split('/').pop();
        
        if (title && date && id) {
          items.push({
            id,
            title,
            publishedAt: date,
            content: [{
              bannerUrl: `/images/news/${id}.jpg`
            }]
          });
        }
      });
      return items;
    });

    await browser.close();

    // Format response
    const result = {
      data: {
        withHighlights: {
          items: newsItems.slice(0, 3)
        },
        items: newsItems.slice(3)
      }
    };

    console.log('Scraped news items:', newsItems.length);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error scraping news:', error);
    res.status(500).json({ 
      error: 'Failed to fetch news', 
      details: error.message,
      stack: error.stack 
    });
  }
}
