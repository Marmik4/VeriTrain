// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract IPRegistry {
    struct Asset {
        string ipHash;
        address owner;
        uint256 timestamp;
        string metadataURI;
    }

    mapping(string => Asset) public assets;
    mapping(string => bool) public hashExists;

    event AssetRegistered(string indexed ipHash, address indexed owner, uint256 timestamp);

    function registerIP(string memory _ipHash, string memory _metadataURI) public {
        require(!hashExists[_ipHash], "Error: This content has already been registered.");

        assets[_ipHash] = Asset({
            ipHash: _ipHash,
            owner: msg.sender,
            timestamp: block.timestamp,
            metadataURI: _metadataURI
        });

        hashExists[_ipHash] = true;
        emit AssetRegistered(_ipHash, msg.sender, block.timestamp);
    }

    function verifyIP(string memory _ipHash) public view returns (address, uint256, string memory) {
        require(hashExists[_ipHash], "Asset not found.");
        Asset memory asset = assets[_ipHash];
        return (asset.owner, asset.timestamp, asset.metadataURI);
    }
}