pkgname=python-orbit-menu
pkgver=1.0.0
pkgrel=1
pkgdesc="Companion daemon for the Orbit Global Menu GNOME Shell extension"
arch=('i686' 'x86_64')
url="https://github.com/Unmade760/orbit-global-menu"
license=('GPL3')
depends=('python-gobject'
         'python-dbus'
         'appmenu-gtk-module'
         'libdbusmenu-gtk2'
         'libdbusmenu-gtk3')
makedepends=('git' 'python-setuptools')
provides=("python-orbit-menu=$pkgver")
source=('git+https://github.com/Unmade760/orbit-global-menu.git')
md5sums=('SKIP')

pkgver() {
    cd "$srcdir/orbit-global-menu"
    python3 -c "import orbitmenu; print(orbitmenu.__version__)"
}

build() {
    cd "$srcdir/orbit-global-menu"
    python3 setup.py bdist_wheel
}

package() {
    cd "$srcdir/orbit-global-menu"
    python3 setup.py install --skip-build --root=$pkgdir --optimize=1
}
