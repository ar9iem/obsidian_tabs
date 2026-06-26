import { Plugin, MarkdownPostProcessorContext, MarkdownRenderer } from 'obsidian';

export default class ArniemTabsPlugin extends Plugin {
    async onload() {
        console.log("Loading Arniem's Custom Tabs with nested block support...");

        this.registerMarkdownCodeBlockProcessor("tabs", async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
            
            // 1. Create a root container wrapper
            const container = el.createDiv({ cls: "custom-tabs-container" });
            
            // 2. Parse the lines inside your markdown code block
            const lines: string[] = source.split("\n");
            
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

            // 3. Render the Tab Headers & Content Panes
            const headerBar = container.createDiv({ cls: "tab-header-bar" });
            const contentArea = container.createDiv({ cls: "tab-content-area" });

            // We use a modern async loop to wait for internal Markdown elements to compile
            for (let index = 0; index < tabTitles.length; index++) {
                const title = tabTitles[index];
                
                // Header Button
                const tabButton = headerBar.createEl("button", { 
                    text: title, 
                    cls: index === 0 ? "tab-btn active" : "tab-btn" 
                });
                
                // Content Pane Wrapper
                const tabPane = contentArea.createDiv({ cls: "tab-pane" });
                if (index !== 0) tabPane.style.display = "none";

                /**
                 * CRITICAL CHANGE: 
                 * Instead of using plain text, we pass the sub-content back into 
                 * Obsidian's own markdown parsing engine. This enables code blocks, links, and styling.
                 */
                await MarkdownRenderer.renderMarkdown(
                    tabContents[index] ?? "", // <-- Add '?? ""' here to resolve the array type error
                    tabPane,
                    ctx.sourcePath ?? "",
                    this
                );

                // Tab switching logic
                tabButton.addEventListener("click", () => {
                    headerBar.querySelectorAll(".tab-btn").forEach((b: Element) => b.classList.remove("active"));
                    contentArea.querySelectorAll(".tab-pane").forEach((p: Element) => (p as HTMLElement).style.display = "none");
                    
                    tabButton.classList.add("active");
                    tabPane.style.display = "block";
                });
            }
        });
    }

    onunload() {
        console.log("Unloading Arniem's Custom Tabs...");
    }
}