import { Graphics } from '@module/graphics';
import { getPages } from '@module/utils/bulk/getPages';
import { convertToStream } from '@module/utils/converters/convertToStream';
import { WriteImageResponse } from '@module/types/writeImageResponse';
import { ToBase64Response } from '@module/types/toBase64Response';

export async function bulkConvert(
  gm: Graphics,
  source: string,
  filePath: string | Buffer,
  pageNumber: number | number[] = 1,
  toBase64 = false
): Promise<WriteImageResponse[] | ToBase64Response[]> {
  if (pageNumber !== -1 && pageNumber < 1) {
    throw new Error('Page number should be more than or equal 1');
  }

  const stream = convertToStream(source, filePath);
  const tempStream = convertToStream(source, filePath);
  const pageNumbers = Array.isArray(pageNumber) ? pageNumber : [pageNumber];

  const getPagesWrapper = async (gm, tempStream, imageMagick) => {
    const base = await getPages(gm, tempStream);
    if (base.length === 1 && base[0] === 0) return [1];
    return imageMagick ? base.concat(base[base.length - 1] + 1) : base;
  };

  pageNumber =
    pageNumber === -1 ? await getPagesWrapper(gm, tempStream, gm.gmClass.imageMagick) : pageNumbers;

  const pages: (Promise<WriteImageResponse> | Promise<ToBase64Response>)[] = pageNumber.map((page) => {
    if (pageNumber < 1) {
      throw new Error('Page number should be more than or equal 1');
    }

    if (!!toBase64) {
      return gm.toBase64(stream, page - 1);
    }

    return gm.writeImage(stream, page - 1);
  });

  return Promise.all(pages);
}
