import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index-core.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'umd',
    name: 'indexCore',
  },
  plugins: [typescript()],
};
