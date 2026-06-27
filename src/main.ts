import { Plugin, MarkdownPostProcessorContext, MarkdownRenderer, MarkdownRenderChild } from 'obsidian';
import { MyPluginSettings, DEFAULT_SETTINGS, SampleSettingTab } from './settings'; // Import settings definitions

/**
 * A custom component that manages the asynchronous rendering and lifecycle
 * of our tab container in both Live Preview and Reading View.
 */
class TabRenderChild extends MarkdownRenderChild {
    source: string;
    sourcePath: string;

    constructor(containerEl: HTMLElement, source: string, sourcePath: string) {
        super(containerEl);
        this.source = source;
        this.sourcePath = sourcePath;
    }

    async onload() {
        this.containerEl.empty();

        const container = this.containerEl.createDiv({ cls: "custom-tabs-container" });
        const lines: string[] = this.source.split("\n");
        const tabTitles: string[] = [];
        const tabContents: string[] = [];

        let currentContent = "";
        lines.forEach((line: string) => {
            if (line.startsWith("=== ")) {
                if (tabTitles.length > 0) tabContents.push(currentContent.trim());
                tabTitles.push(line.replace("=== ", "").trim());
                currentContent = "";
            } else {
                currentContent += line + "\n";
            }
        });
        if (tabTitles.length > 0) tabContents.push(currentContent.trim());

        const headerBar = container.createDiv({ cls: "tab-header-bar" });
        const contentArea = container.createDiv({ cls: "tab-content-area" });

        for (let index = 0; index < tabTitles.length; index++) {
            const title = tabTitles[index];
            
            const tabButton = headerBar.createEl("button", { 
                text: title, 
                cls: index === 0 ? "tab-btn active" : "tab-btn" 
            });
            
            const tabPane = contentArea.createDiv({ cls: "tab-pane" });
            if (index !== 0) tabPane.style.display = "none";

            await MarkdownRenderer.renderMarkdown(
                tabContents[index] ?? "", 
                tabPane, 
                this.sourcePath, 
                this
            );

            tabButton.addEventListener("click", () => {
                headerBar.querySelectorAll(".tab-btn").forEach((b: Element) => b.classList.remove("active"));
                contentArea.querySelectorAll(".tab-pane").forEach((p: Element) => (p as HTMLElement).style.display = "none");
                
                tabButton.classList.add("active");
                tabPane.style.display = "block";
            });
        }
    }
}

export default class TabifyPlugin extends Plugin {
    // 1. Declare the settings property so TypeScript knows it exists
    settings!: MyPluginSettings;

    async onload() {
        console.log("Loading Tabify with robust MarkdownRenderChild lifecycle...");

        // 2. Load your data from disk
        await this.loadSettings();

        // 3. Add the settings tab UI to Obsidian
        this.addSettingTab(new SampleSettingTab(this.app, this));

        this.registerMarkdownCodeBlockProcessor("tabs", (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
            const tabChild = new TabRenderChild(el, source, ctx.sourcePath ?? "");
            ctx.addChild(tabChild);
        });
    }

    onunload() {
        console.log("Unloading Tabify...");
    }

    // 4. Implement the settings lifecycle helpers
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}