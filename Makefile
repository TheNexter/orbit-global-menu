version = `python3 -c "import orbitmenu; print(orbitmenu.__version__)"`

build:
	python3 setup.py install --root=debian --install-layout=deb --no-compile
	cd debian && find . -type f ! -regex '.*.hg.*' ! -regex '.*?debian-binary.*' ! -regex '.*?DEBIAN.*' -printf '%P ' | xargs md5sum > DEBIAN/md5sums && cd -
	sed -i "s/Version: .*/Version: $(version)/" "debian/DEBIAN/control"
	dpkg -b debian/ orbit-menu_$(version)_all.deb

clean:
	rm -rf dist/
	rm -rf build/
	rm -rf *.egg-info/
	rm -rf debian/usr/
	rm -f debian/DEBIAN/md5sums
