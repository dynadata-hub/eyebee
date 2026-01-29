#!/bin/bash

./install-docker-compose-env.sh

mkdir /zk_kafka_data
mkdir /zk_kafka_data/zk-data
mkdir /zk_kafka_data/zk-txn-logs
mkdir /zk_kafka_data/kafka-data

chown -R 1000 /zk_kafka_data