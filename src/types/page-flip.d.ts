declare module 'page-flip' {
  export class PageFlip {
    constructor(element: HTMLElement, setting: Record<string, any>);
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    loadFromImages(imagesPaths: string[]): void;
    updateFromImages(imagesPaths: string[]): void;
    turnToPage(pageNum: number): void;
    turnToPrevPage(): void;
    turnToNextPage(): void;
    flipNext(corner?: 'top' | 'bottom'): void;
    flipPrev(corner?: 'top' | 'bottom'): void;
    flip(pageNum: number, corner?: 'top' | 'bottom'): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    destroy(): void;
    on(eventName: string, appCallback: (e: any) => void): void;
    off(eventName: string): void;
  }
}
