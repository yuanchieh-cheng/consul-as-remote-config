# Consul as remote config
Server 目前採用靜態 config file，部署時從 S3 bucket 拉下後 reload server 更新到最新的 config   
此做法有幾項缺點:  
1. 僅需更新 config 檔案時也需要重新部署 server 
2. 更新檔案麻煩，有遺漏的風險
3. 無法隨 Product team / Delivery team 需求彈性的修正 config 
4. 查看最新 config 檔需要去 S3 bucket 找，也導致要 Review 更新檔案時不容易

## Consul
Consul 是 Hashicorp 旗下推出的工具，主要專注於 `Service Networking` 這一塊的問題  
主要有三大功能
1. Service Discover    
為了確保服務的高可用，通常一個 Service 後面會有多台 Server，所以往往需要 Load Balancer / DNS server 設定，讓其他 Service 要存取時可以指定對應的 Service Name 而不是 hard code 機器 IP  
Consul 提供 DNS 查詢 / HTTP Api 服務，可以在機器啟動時掛在 Service 下，之後查詢 Service Name 就可以取得健康的機器 IP  
2. Key Value  
多台機器要維護 Config 檔案是個難題，Consul 提供 Key Value store 服務，與 Vault 比較大的差異是 Vault 比較專注於機敏資料的部分，同時包含 Key rotate / 加解密演算法的實作等；  
Consul 的最大好處是 `Key 值更新時可以收到通知`，算是個進階版的 Firebase Remote config  
3. Networking Segmentation   
為了監控與分層授權 Service 間的溝通，Consul 可以制定 Service level 的 ACL，例如 只有 A Service 可以跟 B Service 溝通  
同時搭配 Consul proxy 的話，可以做到 TLS 連線加密與 Certificate 確保 Service 身份等驗證  

在架構上，Consul 支援分散式部署，可以同時部署多台 Consul Agent 並加入組成集群，確保 Consul 的可用性  

## 環境  
1. 需要先安裝 Consul，https://www.consul.io/downloads ，接著以 dev 模式啟動 
```
$ consul agent --dev
```

2. 方便起見，使用 consul ui，用瀏覽器開啟 `http://localhost:8500/ui`  
接著選擇到 Key Value 下新增 `api-server`，儲存
```
{
	"hello": "world3",
  	"bucket": "123"
}
```  
備用  

3. 啟動測試用的 server 
```
$ node index.js
```
測試 http request
```
$ curl http://localhost:3001/remote-config
```

4. 回到 Consul UI，更新 `api-server` Value  
接著再打一次 http request，應該能看到回傳值的更新