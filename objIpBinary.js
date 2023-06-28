const ip = require("ip");

class objIpBinary {
  constructor() {
    this.root = {};
  }

  // Convert an IP address to binary
  toBinary(ipAddress) {
    return ip.toLong(ipAddress).toString(2).padStart(32, "0");
  }

  // Insert an IP range into the trie
  insert(cidr, data) {
    let node = this.root;
    const [ipAddress, prefixLength] = cidr.split("/");
    const binary = this.toBinary(ipAddress).substring(0, prefixLength);
    for (const bit of binary) {
      if (!node[bit]) {
        node[bit] = {};
      }
      node = node[bit];
    }
    node.range = cidr;
    node.data = data;
  }

  // Check if an IP address is in any of the ranges in the trie
  contains(ipAddress) {
    let node = this.root;
    const binary = this.toBinary(ipAddress);
    let lastNode = null;
    for (const bit of binary) {
      if (!node[bit]) {
        break;
      }
      node = node[bit];
      if (node.range) {
        lastNode = node;
      }
    }
    return lastNode ? { range: lastNode.range, data: lastNode.data } : null;
  }
}

module.exports = objIpBinary;
