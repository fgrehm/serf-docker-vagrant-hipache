# [Serf](http://www.serfdom.io/) + [Docker](http://www.docker.io/) + [Vagrant](http://www.vagrantup.com/) + [hipache](https://github.com/dotcloud/hipache)

This repo contains some experiments with the quartet. Basically, we are going to
simulate the launch of 2 instances of 2 different dummy nodejs apps in docker
containers and each app will use Serf to distribute events which the hipache
server listens for to update its config.

There are 3 different VMs involved and in order to keep the amount of resource
usage low we use [vagrant-lxc](https://github.com/fgrehm/vagrant-lxc) containers
as Vagrant VMs. Two VMs will host multiple docker containers and the other will
run hipache.

I personally tested this on my own laptop and on a DigitalOcean Droplet, both
Ubuntu 13.04 hosts.

## Getting started

If you are on an Ubuntu host, just make sure you have [vagrant-lxc](https://github.com/fgrehm/vagrant-lxc)
configured and follow the steps below. If you are on a Mac / Windows host, please
use  the `raring` VirtualBox VM available at [vagrant-lxc-vbox-hosts](https://github.com/fgrehm/vagrant-lxc-vbox-hosts)
and follow the instructions from the project's root.

If you have [bindler](https://github.com/fgrehm/bindler) configured, run
`vagrant plugins bundle` to install the required plugins or run the commands
below to get everything in place:

```
vagrant plugin install vagrant-lxc
vagrant plugin install vagrant-cachier
vagrant plugin install vagrant-hostmanager
vagrant plugin install ventriloquist
```

Then bring the VMs up and start the required services:

```
# This takes around 15min down here, so go grab a coffee
vagrant up

# This is only needed on the first up, I haven't figured out how to set things
# up in a way to avoid this, a simple `vagrant reload` does the trick too
vagrant ssh hipache -c 'for s in hipache serf; do sudo start $s; done'
for vm in dockers-1 dockers-2; do
  vagrant ssh $vm -c 'for s in serf serf-join; do sudo start $s; done'
done
```


### "[Deploy](scripts/deploy-nodejs-app)" your apps and let hipache know about it

```
for vm in dockers-1 dockers-2; do
  for app in app-1 app-2; do
    for i in $(seq 1 2); do
      vagrant ssh $vm -c "/vagrant/scripts/deploy-nodejs-app ${app} instance-${i}"
    done
  done
done
```

This will [run the Docker container](scripts/deploy-nodejs-app#L9) and will
[notify Serf](scripts/deploy-nodejs-app#L16) members about the "deploy".

To see the load balancer in action:

```
for app in app-1 app-2; do
  echo "## Hitting ${app}"
  for i in $(seq 1 10); do
    curl -s "${app}.vagrant.dev:8080" && sleep 0.4
  done
done | less
```

The output is not deterministic but you might see something like the one below
where the request gets through hipache on one machine and passes through the
docker containers running on the other 2 machines:

```
## Hitting app-1
Hello from: app-1.instance-2.dockers-1
Hello from: app-1.instance-1.dockers-1
Hello from: app-1.instance-2.dockers-2
Hello from: app-1.instance-1.dockers-1
Hello from: app-1.instance-2.dockers-2
Hello from: app-1.instance-2.dockers-2
Hello from: app-1.instance-1.dockers-2
Hello from: app-1.instance-1.dockers-1
Hello from: app-1.instance-1.dockers-1
Hello from: app-1.instance-1.dockers-1

## Hitting app-2
Hello from: app-2.instance-2.dockers-1
Hello from: app-2.instance-2.dockers-1
Hello from: app-2.instance-2.dockers-1
Hello from: app-2.instance-2.dockers-1
Hello from: app-2.instance-2.dockers-2
Hello from: app-2.instance-2.dockers-1
Hello from: app-2.instance-2.dockers-2
Hello from: app-2.instance-1.dockers-1
Hello from: app-2.instance-1.dockers-1
Hello from: app-2.instance-2.dockers-1
```

### Clean up

To start fresh, run:

```
vagrant ssh hipache -c "for app in app-1 app-2; do redis-cli del frontend:${app}.vagrant.dev; done"
for vm in dockers-1 dockers-2; do
  vagrant ssh $vm -c "/vagrant/scripts/docker/clean-containers"
done
vagrant reload
```

### Logging

All logs are written to `/logs` and you can check out whats happening under the
hood by a simple `tail -f logs/*.log`

### How does it work?

There are 3 vagrant-lxc containers that make up for Vagrant VMs and gets
provisioned with a few things apart from [Serf agents](http://www.serfdom.io/docs/agent/basics.html):

| Machine | What does it do? |
| ------- | ---------------- |
| hipache   | Runs hipache as a plain old nodejs app on port `8080` |
| dockers-1 | Runs dummy nodejs apps as Docker containers |
| dockers-2 | Runs dummy nodejs apps as Docker containers |

The Serf agents are brought up with [some](scripts/serf/configure-dockers-agent)
[upstart](scripts/serf/configure-hipache-agent) jobs whenever the machine starts
and the `dockers-X` machines gets an [extra job](scripts/serf/configure-dockers-agent#L23-L36)
that makes sure the agents are aware of each other by running a `serf join` back
to the hipache machine.

The "deploy" is composed of a [`docker run`](scripts/deploy-nodejs-app#L9) + a
[`serf event deploy "dockers-X.vagrant.dev:app-1:CONTAINER_PORT`](scripts/deploy-nodejs-app#L16)
from the `dockers-X` VM. The event is then captured by the `hipache` VM and
the hipache server gets configured by [adding some entries to a redis list](scripts/handle-deploy#L28-L31).

### Acknowledgement

Thanks to [@jpfuentes2](https://github.com/jpfuentes2) for some early feedback
on this. You might want to check out his [hipster-devops](https://github.com/jpfuentes2/hipster-devops)
for another example of using Serf and Docker.

## Got feedback?

Apart from Vagrant, I'm fairly new to most of the stuff here, feel free to open
up an issue here on GitHub and / or shoot a tweet to [@fgrehm](https://twitter.com/fgrehm).
