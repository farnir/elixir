defmodule KBRW.JsonloaderTest do
	use ExUnit.Case

	test "insert JSON data in database" do
		KBRW.Jsonloader.load_to_database(KBRW.Database, "../data/orders_chunk0.json")
		tmp = KBRW.Database.get(KBRW.Database, "nat_order000147671")

		assert Map.get(tmp, "id") == "nat_order000147671"
	end
end