import {IPage, PageList} from "@types";
import Scraper from "./Scraper.js";
import Path from "path";
import {createDir, sanitizeFileName} from "./helpers/files.js";
import ScreenShots from "./screenShots.js";
import {log} from "./logger.js";
import fs from "fs";

export default class Crawler {
	private readonly pageList: PageList;
	private readonly entryPoint: URL;
	private captureDir: string;

	public constructor(rawEntryPoint: string) {
		this.pageList = new Map<string, IPage>();
		this.entryPoint = new URL(rawEntryPoint);
		this.pageList.set(rawEntryPoint, this.createSeed());
		this.captureDir = Path.join('.', 'captures', sanitizeFileName(this.entryPoint.host), sanitizeFileName(new Date().toLocaleString()));
	}

	public async crawl() {
		const {entryPoint, pageList, captureDir} = this;

		const scraper = new Scraper(pageList, entryPoint.host);
		await createDir(captureDir);
		const screenShots = await ScreenShots.init(captureDir);
		let i = 0;
		for (const [url, page] of pageList) {
			log(`Checking ${url}`, 2);
			const loaded = await scraper.checkPage(page);
			if (loaded === true) {
				await screenShots.capture(url);
			}

			if (i % 50 === 0) {
				this.writeList();
			}
		}
		await screenShots.close();
		this.writeList();
		return this.pageList;
	}

	private writeList() {
		fs.writeFileSync(Path.resolve(this.captureDir, "crawl.json"), JSON.stringify(Array.from(this.pageList)))
	}

	private createSeed(): IPage {
		return {
			url: this.entryPoint,
			foundOn: 'Entry Point',
		}
	}

}
