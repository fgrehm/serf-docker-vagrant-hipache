# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

ENV['VAGRANT_DEFAULT_PROVIDER'] = 'lxc'

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box     = "raring64"
  config.vm.box_url = 'http://bit.ly/vagrant-lxc-raring64-2013-10-23'

  config.vm.provider :lxc do |lxc|
    # Required to boot nested docker containers
    lxc.customize 'aa_profile', 'unconfined'
  end

  config.vm.define 'hipache' do |node|
    node.vm.hostname = 'hipache.vagrant.dev'
    node.hostmanager.aliases = ['app-1.vagrant.dev', 'app-2.vagrant.dev']
    node.vm.network "forwarded_port", guest: 8080, host: 8080
    node.vm.provision :shell, path: 'scripts/configure-lxc'
    node.vm.provision :ventriloquist do |env|
      env.services  << 'redis'
      env.platforms << 'nodejs'
    end
    node.vm.provision :shell, privileged: false, path: 'scripts/hipache/install'
    node.vm.provision :shell, path: 'scripts/hipache/configure-upstart'
    node.vm.provision :shell, path: 'scripts/serf/install'
    node.vm.provision :shell, path: 'scripts/serf/configure-hipache-agent'
  end

  config.vm.define 'dockers-1' do |node|
    node.vm.hostname = 'dockers-1.vagrant.dev'
    node.vm.provision :shell, path: 'scripts/configure-lxc' do |s|
      s.args = "'10.0.251'"
    end
    node.vm.provision :docker do |docker|
      docker.pull_images 'busybox'
      docker.pull_images 'shykes/nodejs'
    end
    node.vm.provision :shell, path: 'scripts/docker/build-nodejs-image'
    node.vm.provision :shell, path: 'scripts/serf/install'
    node.vm.provision :shell, path: 'scripts/serf/configure-dockers-agent'
  end

  config.vm.define 'dockers-2' do |node|
    node.vm.hostname = 'dockers-2.vagrant.dev'
    node.vm.provision :shell, path: 'scripts/configure-lxc' do |s|
      s.args = "'10.0.250'"
    end
    node.vm.provision :docker do |docker|
      docker.pull_images 'busybox'
      docker.pull_images 'shykes/nodejs'
    end
    node.vm.provision :shell, path: 'scripts/docker/build-nodejs-image'
    node.vm.provision :shell, path: 'scripts/serf/install'
    node.vm.provision :shell, path: 'scripts/serf/configure-dockers-agent'
  end

  config.hostmanager.enabled     = true
  config.hostmanager.manage_host = true

  config.cache.auto_detect = true
  config.cache.scope       = :machine
end
