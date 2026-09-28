import setuptools

import globalmenu

with open('README.md', 'r') as fh:
	long_description = fh.read()

setuptools.setup(
	name='global-menu',
	version=globalmenu.__version__,
	author='unmade.space',
	description='Companion daemon for the Global Menu GNOME Shell extension',
	long_description=long_description,
	long_description_content_type='text/markdown',
	url='https://github.com/Unmade760/orbit-global-menu',
	packages=setuptools.find_packages(),
	data_files=[
		('share/applications', ['global-menu-hud.desktop'])
	],
	install_requires=[
		'PyGObject>=3.30.0'
	],
	classifiers=[
		'Programming Language :: Python :: 3',
		'License :: OSI Approved :: GNU General Public License v3 (GPLv3)',
		'Operating System :: POSIX :: Linux'
	],
	project_urls={
		'Bug Reports': 'https://github.com/Unmade760/orbit-global-menu/issues',
		'Source': 'https://github.com/Unmade760/orbit-global-menu',
	},
	entry_points={
		'console_scripts': [
			'global-menu = globalmenu.run:main',
			'global-menu-hud = globalmenu.inithud:main'
		]
	}
)
