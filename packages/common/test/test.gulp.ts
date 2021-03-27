import { src } from "gulp";
import mocha from "gulp-mocha";

export const testCommon = () => src([`${__dirname}/**/*.spec.ts`]).pipe(
    mocha({
      // @ts-ignore Types don't have require yet.
      require: ["./register-ts-node"]
    })
  );
