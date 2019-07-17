defmodule KBRW.Jsonloader do

	@doc """
	Insert Json data in database.
	"""
	def load_to_database(database, json_file) do
		{:ok, tmp} = File.read(Path.expand(json_file))
		map = Poison.Parser.parse!(tmp, %{})
		Enum.each map, fn record ->
			KBRW.Database.insert(database, Map.get(record, "id"), record)
		end
	end

	def load_to_riak(bucket, json_file, nb_task) do
		{:ok, file} = File.read(Path.expand(json_file))
		data = Poison.Parser.parse!(file, %{})
		size = trunc(length(data) / nb_task)
		chunk_tab = Enum.chunk_every(data, size)
		Enum.each chunk_tab, fn chunk ->
			Task.start(fn ->
				Enum.each chunk, fn record ->
					KBRW.Riak.createObject(bucket, Poison.encode!(record))
				end
			end)
		end
		:ok
	end
end