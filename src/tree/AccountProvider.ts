import { TreeDataProvider, EventEmitter, Event, TreeView, TreeItem } from "vscode";
import { getAccountItems } from "../managers/TreeManager";
import { CalTreeItem } from "../models/CalTreeItem";

export class AccountProvider implements TreeDataProvider<CalTreeItem> {
  private _onDidChangeTreeData: EventEmitter<CalTreeItem | undefined> = new EventEmitter<CalTreeItem | undefined>();

  readonly onDidChangeTreeData: Event<CalTreeItem | undefined> = this._onDidChangeTreeData.event;

  private view: TreeView<CalTreeItem>;

  constructor() {
    //
  }

  async revealTree(item: CalTreeItem) {
    try {
      // select the readme item
      this.view.reveal(item, {
        focus: true,
        select: false,
      });
    } catch (err) {
      console.log(`Unable to select tree item: ${err.message}`);
    }
  }

  bindView(kpmTreeView: TreeView<CalTreeItem>): void {
    this.view = kpmTreeView;
  }

  getParent(_p: CalTreeItem) {
    return void 0; // all playlists are in root
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(null);
  }

  refreshParent(parent: CalTreeItem) {
    this._onDidChangeTreeData.fire(parent);
  }

  getTreeItem(element: CalTreeItem): TreeItem {
    return element;
  }

  async getChildren(element?: CalTreeItem): Promise<CalTreeItem[]> {
    let items: CalTreeItem[] = [];
    if (element) {
      // return the children of this element
      items = element.children;
    } else {
      // return the parent elements
      items = await getAccountItems();
    }
    return items;
  }
}
