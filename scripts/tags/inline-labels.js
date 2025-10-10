/**
 * 修饰文本标签 | https://github.com/xaoxuu/hexo-theme-stellar/
 *
 * example:
 * {% psw 这是密码 %}
 */

'use strict'


hexo.extend.tag.register('u', function (args) {
  return hexo.render.renderSync({ text: `<u>${args.join(' ')}</u>`, engine: 'markdown' }).trim().replace(/^<p>(.*?)<\/p>$/g, '$1')
})
hexo.extend.tag.register('emp', function (args) {
  return hexo.render.renderSync({ text: `<emp>${args.join(' ')}</emp>`, engine: 'markdown' }).trim().replace(/^<p>(.*?)<\/p>$/g, '$1')
})
hexo.extend.tag.register('wavy', function (args) {
  return hexo.render.renderSync({ text: `<wavy>${args.join(' ')}</wavy>`, engine: 'markdown' }).trim().replace(/^<p>(.*?)<\/p>$/g, '$1')
})
hexo.extend.tag.register('del', function (args) {
  return hexo.render.renderSync({ text: `<del>${args.join(' ')}</del>`, engine: 'markdown' }).trim().replace(/^<p>(.*?)<\/p>$/g, '$1')
})
hexo.extend.tag.register('kbd', function (args) {
  return hexo.render.renderSync({ text: `<kbd>${args.join(' ')}</kbd>`, engine: 'markdown' }).trim().replace(/^<p>(.*?)<\/p>$/g, '$1')
})
hexo.extend.tag.register('psw', function (args) {
  return hexo.render.renderSync({ text: `<psw>${args.join(' ')}</psw>`, engine: 'markdown' }).trim().replace(/^<p>(.*?)<\/p>$/g, '$1')
})
hexo.extend.tag.register('blur', function (args) {
  return hexo.render.renderSync({ text: `<blur>${args.join(' ')}</blur>`, engine: 'markdown' }).trim().replace(/^<p>(.*?)<\/p>$/g, '$1')
})
hexo.extend.tag.register('sup', function (args) {
  args = hexo.args.map(args, ['color'], ['text'])
  var el = ''
  el += '<sup class="tag-plugin colorful sup"' + ' ' + hexo.args.joinTags(args, ['color']).join(' ') + '>'
  el += args.text
  el += '</sup>'
  return el
})
hexo.extend.tag.register('sub', function (args) {
  args = hexo.args.map(args, ['color'], ['text'])
  var el = ''
  el += '<sub class="tag-plugin colorful sub"' + ' ' + hexo.args.joinTags(args, ['color']).join(' ') + '>'
  el += args.text
  el += '</sub>'
  return el
})
