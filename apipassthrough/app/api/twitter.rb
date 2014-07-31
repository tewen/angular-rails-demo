module Twitter
  class API < Grape::API

    version 'v1'
    format :json

    resource :status do
      params do
        requires :status, type: String
      end
      post '/update' do
        puts 'Status'
        puts params[:status]
        puts 'Posted to TWITTER!'
      end
    end
  end
end