
import JSZip from "jszip";

export interface ZipFileEntry {
  name: string;
  content: string;
  path: string[];
}

export const extractZipFiles = async (zipFile: File): Promise<ZipFileEntry[]> => {
  console.log('Extracting files from zip...');
  
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(zipFile);
  const files: ZipFileEntry[] = [];

  for (const [path, file] of Object.entries(zipContent.files)) {
    if (file.dir || !path.endsWith('.csv')) continue;

    try {
      const content = await file.async('text');
      const pathParts = path.split('/').filter(part => part !== '');
      
      files.push({
        name: pathParts[pathParts.length - 1],
        content,
        path: pathParts.slice(0, -1) // Remove filename from path
      });
    } catch (error) {
      console.warn(`Failed to read file ${path}:`, error);
    }
  }

  console.log(`Extracted ${files.length} CSV files from zip`);
  return files;
};
