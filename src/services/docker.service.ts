import Dockerode from "dockerode";

const docker = new Dockerode({ socketPath: "/var/run/docker.sock" });

export async function listContainers() {
  return docker.listContainers({ all: true });
}

export async function restartContainer(name: string) {
  const container = docker.getContainer(name);
  await container.restart();
}