# Виртуальные машины
---

Развернуто 7 (через техническую поддержку была увеличена квота, по умолчанию 5) виртуальных машин (VM) со следующими характеристиками: **2 CPU / 2 RAM / 20 SSD**

Список VM:

- haproxy - HAProxy;
- pg-01 - PostgreSQL + Patroni;
- pg-02 - PostgreSQL + Patroni;
- etcd-01 - etcd;
- etcd-02 - etcd;
- etcd-03 - etcd;
- prometheus - prometheus.

Для каждой VM создан снапшот, чтобы можно было тратить меньше времени на ее пересоздание в случае необходимости.

Все VM объединены одной виртуальной сетью.

Правила Firewall для виртуальной сети:

По умолчанию: Reject

Разрешены все протоколы и порты для:

- Home;
- Kubernetes;
- Внутренняя сеть;
- Внешние адреса VM;
- Доступ к Prometheus для всех по авторизации.

У всех VM есть внешний адрес, но так как судя по всему используется NAT 1:1, то Firewall виртуальной сети функционирует и тут.

Внешние адреса используется для того, чтобы попадать на хосты по SSH для возможной отладки и в случае HAProxy, чтобы открыть доступ Kubernetes.


# PostgreSQL / Patroni / etcd / HAProxy
---


## Ansible
- - -

За основу была взята роль Ansible postgresql_cluster из репозитория https://github.com/vitabaks/postgresql_cluster из который удалены хвосты GitHuh, Molecule и файлы Consul.

Роль не подразумевает использования публичных адресов (да и при NAT 1:1 работать не будет, потому что адреса в хостах биндятся на интерфейс), поэтому при запуске инсталляции с ноутбука сперва создается туннель до VM с HAProxy при помощи sshuttle, чтобы получить доступ ко внутренней сети VM.

В роль добавлены:

- Добавление адреса HAProxy через переменную cluster_ip в pg_hba.conf;
- Создание БД в процессе установки и загрузка в нее SQL-дампа: roles/postgresql-databases/ с нужными базами, таблицами, 10 городами и рандомно генерируемыми данными по температуре.

После первой установки необходимо в inventory поменять флаг `postgresql_exists` в true у `хостов` в группах `[master]` и `[replica]`, чтобы не получить ошибку при перенакатке роли.

Адрес со статистикой HAProxy: [Statistics Report for HAProxy](http://haproxy:7000/stats)


# Weather API
---


## Helm
- - -

В Helm Chart добавлен хак с `rollme: {{ randAlphaNum 5 | quote }}` для пересоздания подов после каждого `upgrade`. В Helm Chart созданном через `create` она добавляется в зависимость от `podAnnotations`. Вырезать ее не стал, просто добавил заглушку.

Итоговое приложение находится по адресу:  http://iduniti4uah5ei.local/


# Prometheus / Exporters / Grafana
- - -

Prometheus установлен вручную на отдельной виртуальной машине.

Установлена авторизация по логину/паролю и добавлен самоподписанный сертификат.

Включен `enable-admin-api` для доступ к API для управления данными через `curl`

Storage retention выставлен в 90 дней.

Метрики:

- Prometheus;
- node_exporter;
  - Хосты разделены по группам при помощи меток;
- patroni_exporter;
  - Добавлена метка service_name для отображения селектора и имени в дашборде;
- etcd_exporter;
- postgresql_exporter;
- blackbox_exporter (сам blackbox и его метрики);
- alertmanager (сам alertmanager и его метрики).

Используемые шаблоны Grafana:

- [Node Exporter Full  | Grafana Labs](https://grafana.com/grafana/dashboards/1860-node-exporter-full/)
  - Внесены изменения для корректного отображения групп хостов;
  - На экспортерах включены коллекторы `systemd` и `processes` для корректной работы дашборда;
- [PostgreSQL Patroni | Grafana Labs](https://grafana.com/grafana/dashboards/18870-postgresql-patroni/)
- [Etcd by Prometheus | Grafana Labs](https://grafana.com/grafana/dashboards/3070-etcd/)
  - Немного странный шаблон, либо же я не разобрался, так как сразу в глаза бросилась странная метрика `The total number of failed proposals seen`, которая показывала `1`. Оказалось, что она смотрит на counter `etcd_server_leader_changes_seen_total`. Поменял на `etcd_server_proposals_failed_total`.
- [PostgreSQL Database | Grafana Labs](https://grafana.com/grafana/dashboards/9628-postgresql-database/)
  - datasource ограничен одним источником;
  - Судя по всему дашборд достаточно старый, так как многие счетчики в дашборде не соответствуют своим названиям (например в pg_stat_bgwriter_*, в них добавлен префикс _total);
- [Alertmanager | Grafana Labs](https://grafana.com/grafana/dashboards/9578-alertmanager/)
  - Убраны ненужны графики;
- [Prometheus Blackbox Exporter | Grafana Labs](https://grafana.com/grafana/dashboards/7587-prometheus-blackbox-exporter/)
  - Добавлен график Response Code.
- 4 Golden Signals

Адрес с Prometheus: https://prometheus:9090/

## Ansible
- - -

Для node_exporter была сделана роль prometheus_node_exporter, который устанавливает и запускает node_exporter с авторизацией и коллекторами systemd, processes и filesystem.ignored-mount-points.

Для postgresql_exporter была сделана роль prometheus_postgresql_exporter, который устанавливает и запускает postgresql_exporter с авторизацией и коллектором postmaster.