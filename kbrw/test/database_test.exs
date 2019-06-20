defmodule KBRW.DatabaseTest do
	use ExUnit.Case, async: true

	test "create new key/value" do
		KBRW.Database.insert(KBRW.Database, "Apple", "3")

		assert KBRW.Database.get(KBRW.Database, "Apple") == "3"
	end

	test "delete key" do
		KBRW.Database.insert(KBRW.Database, "Apple", "3")
		KBRW.Database.delete(KBRW.Database, "Apple")

		assert KBRW.Database.get(KBRW.Database, "Apple") == :empty
	end

	test "change key" do
		KBRW.Database.insert(KBRW.Database, "Apple", "3")
		KBRW.Database.insert(KBRW.Database, "Apple", "4")

		assert KBRW.Database.get(KBRW.Database, "Apple") == "3"

		KBRW.Database.change(KBRW.Database, "Apple", "4")
		assert KBRW.Database.get(KBRW.Database, "Apple") == "4"
	end
end