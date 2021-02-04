import { commands, Disposable, TreeItemCollapsibleState, TreeView } from "vscode";
import { CalTreeItem } from "../models/CalTreeItem";

const collapsedStateMap = {};
// mutable
let eventIdMap = {};

export const connectTreeView = (view: TreeView<CalTreeItem>) => {
  return Disposable.from(
    view.onDidCollapseElement(async (e) => {
      const item: CalTreeItem = e.element;
      collapsedStateMap[item.id] = TreeItemCollapsibleState.Collapsed;
    }),

    view.onDidExpandElement(async (e) => {
      const item: CalTreeItem = e.element;
      collapsedStateMap[item.id] = TreeItemCollapsibleState.Expanded;
    }),

    view.onDidChangeSelection(async (e) => {
      //
    }),

    view.onDidChangeVisibility((e) => {
      if (e.visible) {
        //
      }
    })
  );
};

export function handleChangeSelection(view: TreeView<CalTreeItem>, item: CalTreeItem) {
  if (item?.command) {
    const args = item.command?.arguments || [];
    args.unshift(item);
    commands.executeCommand(item.command.command, ...args);
  }
}

export function isExpanded(id: string) {
  return !!(collapsedStateMap[id] && collapsedStateMap[id] === TreeItemCollapsibleState.Expanded);
}
