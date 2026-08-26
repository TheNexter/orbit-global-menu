#!/usr/bin/python3

import dbus

def main():
	session = dbus.SessionBus()
	proxy = session.get_object('space.unmade.OrbitMenu', '/space/unmade/OrbitMenu')
	proxy.EmitHudActivated()

if __name__ == "__main__":
	main()
