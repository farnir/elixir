defmodule Server.Router do
  use Server.TheCreator

  #my_error code: 404, content: "Custom error message"

  my_get "/" do
    {200, "Welcome to the new world of Plugs!"}
  end

  my_get "/me" do
    {200, "You are the Second One."}
  end
end