/**
 * Multer file shape used by FileInterceptor.
 * Local type to avoid Express.Multer namespace issues with @types/express v5.
 * @see https://github.com/DefinitelyTyped/DefinitelyTyped/issues/47780
 */
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  stream: import('stream').Readable;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}
