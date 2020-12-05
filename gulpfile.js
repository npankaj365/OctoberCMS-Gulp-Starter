let localhost  = 'localhost', // Local domain
		theme      = 'mytheme', // Theme folder name
		fileswatch = 'html,htm,php,txt,yaml,twig,json,md' // List of files extensions for watching & hard reload (comma separated)

const { src, dest, parallel, series, watch } = require('gulp')
const browserSync  = require('browser-sync').create()
const webpack      = require('webpack-stream')
const sass         = require('gulp-sass')
const rename       = require('gulp-rename')
const autoprefixer = require('gulp-autoprefixer')
const rsync        = require('gulp-rsync')

function browsersync() {
	browserSync.init({
		proxy: localhost,
		notify: false,
		online: true
	})
}

function scripts() {
	return src(`themes/${theme}/assets/scripts/theme.js`)
	.pipe(webpack({
		mode: 'production',
		module: {
			rules: [
				{
					test: /\.(js)$/,
					exclude: /(node_modules)/,
					loader: 'babel-loader',
					query: {
						presets: ['@babel/env']
					}
				}
			]
		}
	})).on('error', function handleError() {
		this.emit('end')
	})
	.pipe(rename('theme.min.js'))
	.pipe(dest(`themes/${theme}/assets/scripts/dist`))
	.pipe(browserSync.stream())
}

function styles() {
	return src(`themes/${theme}/assets/styles/theme.sass`)
	.pipe(sass({ outputStyle: 'compressed' }))
	.pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true }))
	.pipe(rename('theme.min.css'))
	.pipe(dest(`themes/${theme}/assets/styles/dist`))
	.pipe(browserSync.stream())
}

function deploy() {
	return src('/')
	.pipe(rsync({
		root: '/',
		hostname: 'username@yousite.com', // Deploy hostname
		destination: 'yousite/public_html/', // Deploy destination
		include: [ '*.htaccess', ], // Included files to deploy
		exclude: [ // Excluded files from deploy
			'storage/*.sqlite',
			'**/Thumbs.db',
			'**/*.DS_Store',
			'node_modules',
			'gulpfile.js',
			'package.json',
			'package-lock.json',
			'npm-debug.log',
			'debug.log',
			`themes/${theme}/assets/scripts/theme.js`,
			`themes/${theme}/assets/styles/**/*.sass`,
		],
		recursive: true,
		archive: true,
		silent: false,
		compress: true
	}))
}

function startwatch() {
	watch([`themes/${theme}/assets/styles/**/*`, `!themes/${theme}/assets/styles/dist/**`], { usePolling: true }, styles)
	watch([`themes/${theme}/assets/scripts/**/*.js`, `!themes/${theme}/assets/scripts/dist/**`], { usePolling: true }, scripts)
	watch([`themes/${theme}/**/*.{${fileswatch}}`, `plugins/**/*.{${fileswatch}}`], { usePolling: true }).on('change', browserSync.reload)
}

exports.scripts     = scripts;
exports.styles      = styles;
exports.deploy      = deploy;
exports.assets      = parallel(scripts, styles);
exports.default     = series(scripts, styles, parallel(browsersync, startwatch));
