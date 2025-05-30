import { writable, get, derived } from 'svelte/store';
import type { ModFolders, ReadDirectoryOptions } from '../../../../types/fs.types';
import type { DirectChildren, getDirectChildrenOptions } from '../../../../types/mods.types';

class ModsHelper {
  resizableSize = writable(20);
  currentFolderPath = writable("");
  folders = writable<ModFolders[]>();
  folderChildren = writable<DirectChildren[]>([]);
  currentCharPath = writable("");

  folder = {
    getAll: async () => await window.api.mods.folder.getAll(),
    create: async (name: string, path: string) => await window.api.mods.folder.create(name, path),
    delete: async (path: string) => await window.api.mods.folder.delete(path),
    dir: {
      read: async (path: string, options?: ReadDirectoryOptions) => await window.api.mods.folder.dir.read(path, options)
    }
  }

  ui = {
    resizable: {
      get: async () => await window.api.mods.ui.resizable.get(),
      set: async (size: number) => {
        this.resizableSize.set(size);
        await window.api.mods.ui.resizable.set(size);
      }
    }
  }

  mod = {
    toggle: async (path: string) => await window.api.mods.mod.toggle(path)
  }

  async getDirectChildren(path: string, options: getDirectChildrenOptions = {}): Promise<DirectChildren[]> {
    const { dirOnly = true } = options;


    const children = await window.api.fss.readDir(path, { recursive: 1 });

    const filteredChildren = dirOnly
      ? children.filter(child => child.isDirectory)
      : children;

    const data = filteredChildren.map(async (child) => {
      const hasIni = child.children?.some(item => item.name.endsWith('.ini')) || false;

      let previewPath: string | null = null;
      const previewImage = child.children?.find(item => item.name === 'preview');
      const firstImage = child.children?.find(item => !item.isDirectory &&
        ['jpg', 'jpeg', 'png', 'gif', 'avif', 'avifs'].includes(item.name.split('.').pop()!.toLowerCase()));

      if (previewImage) {
        previewPath = previewImage.path;
      } else if (firstImage) {
        previewPath = firstImage.path;
      }

      let preview: { path: string, base64: string | null } | null = null;
      if (previewPath) {
        // const base64 = await window.api.fss.getImgBase64(previewPath);
        preview = { path: previewPath, base64: null };
      }

      return {
        path: child.path,
        name: child.name,
        hasIni: hasIni,
        preview
      };
    });

    return Promise.all(data);
  }
}

const Mods = new ModsHelper();
export { Mods };