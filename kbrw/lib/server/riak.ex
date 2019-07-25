defmodule KBRW.Riak do
    def search(index, query, page \\ 0, rows \\ 30, sort \\ 'items') do
        page = cond do
            page >= 1 -> (page - 1) * rows
            true -> 0
        end
        url = "http://localhost:8098/search/query/#{index}?wt=json&q=#{query}&start=#{page}&rows=#{rows}&sort=#{sort}+desc"
        url = to_charlist Regex.replace(~r/\s/, url, "+")        
        {:ok, {{'HTTP/1.1', 200, 'OK'}, _headers, body}} = 
        :httpc.request(:get, {url, []}, [], [])
        data = Poison.decode!(body)["response"]
        Poison.encode!(data)
    end

    def getBuckets() do
        url = 'http://127.0.0.1:8098/buckets?buckets=true'
        {:ok, {{'HTTP/1.1', 200, 'OK'}, _headers, body}} = 
        :httpc.request(:get, {url, []}, [], [])
        body
    end

    def getBucketKeys(bucket) do
        url = 'http://127.0.0.1:8098/buckets/#{bucket}/keys?keys=true'
        {:ok, {{'HTTP/1.1', 200, 'OK'}, _headers, body}} = 
        :httpc.request(:get, {url, []}, [], [])
        body
    end

    def deleteBucket(bucket) do
        json = getBucketKeys(bucket)
        keys = Poison.decode!(json)["keys"]
        Enum.each keys, fn key ->
            deleteObject(bucket, key)
        end
        updateBucket(bucket);
        :ok
    end

    def updateBucket(bucket) do
        json = getBucketKeys(bucket)
        keys = Poison.decode!(json)["keys"]
        Enum.each keys, fn key ->
            {code, value} = getObject(bucket, key)
            if code == 200 do
                deleteObject(bucket, key)
                createObject(bucket, value)
            end
        end
        :ok
    end

    def getObject(bucket, key) do
        url = 'http://127.0.0.1:8098/buckets/#{bucket}/keys/#{key}'
        {:ok, {{'HTTP/1.1', code, _message}, _headers, body}} = 
        :httpc.request(:get, {url, []}, [], [])
        {code, body}
    end

    def createObject(bucket, object) do
        head = ''
        contentType = 'application/json'
        bodyIn = object
        url = 'http://127.0.0.1:8098/buckets/#{bucket}/keys'
        {:ok, {{'HTTP/1.1', 201, 'Created'}, _headers, _body}} = 
        :httpc.request(:post, {url, head, contentType, bodyIn}, [], [])
        :ok
    end

    def createObject(bucket, object, key) do
        head = ''
        contentType = 'application/json'
        bodyIn = object
        url = 'http://127.0.0.1:8098/buckets/#{bucket}/keys/#{key}'
        {:ok, {{'HTTP/1.1', 204, 'No Content'}, _headers, _body}} = 
        :httpc.request(:post, {url, head, contentType, bodyIn}, [], [])
        :ok
    end

    def deleteObject(bucket, key) do
        url = 'http://127.0.0.1:8098/buckets/#{bucket}/keys/#{key}'
        :httpc.request(:delete, {url, []}, [], [])
        :ok
    end

    def uploadSchema(name, filename) do
        head = ''
        contentType = 'application/xml'
        {:ok, tmp} = File.read(Path.expand(filename))
        bodyIn = tmp
        url = 'http://127.0.0.1:8098/search/schema/#{name}'
        {:ok, {{'HTTP/1.1', 204, 'No Content'}, _headers, _body}} =
        :httpc.request(:put, {url, head, contentType, bodyIn}, [], [])
        :ok
    end

    def createIndex(index, schema) do
        head = ''
        contentType = 'application/json'
        bodyIn = '{"schema": "#{schema}"}'
        url = 'http://127.0.0.1:8098/search/index/#{index}'
        {:ok, {{'HTTP/1.1', 204, 'No Content'}, _headers, _body}} =
        :httpc.request(:put, {url, head, contentType, bodyIn}, [], [])
        :ok
    end

    def assignIndex(index, bucket) do
        head = ''
        contentType = 'application/json'
        bodyIn = '{"props":{"search_index":"#{index}"}}'
        url = 'http://127.0.0.1:8098/buckets/#{bucket}/props'
        {:ok, {{'HTTP/1.1', 204, 'No Content'}, _headers, _body}} =
        :httpc.request(:put, {url, head, contentType, bodyIn}, [], [])
        :ok
    end
end