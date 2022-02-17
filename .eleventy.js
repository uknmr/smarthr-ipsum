module.exports = (eleventyConfig) => {
  eleventyConfig.addPassthroughCopy('src/js')

  return {
    dir: {
      input: 'src',
      output: 'dist',
    },
  }
}
