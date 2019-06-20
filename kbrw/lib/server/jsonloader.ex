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
end