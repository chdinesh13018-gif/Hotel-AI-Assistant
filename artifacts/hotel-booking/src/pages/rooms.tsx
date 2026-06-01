import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ChatWidget } from "@/components/chatbot/chat-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useListRooms } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Users, IndianRupee, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { getRoomImage } from "@/lib/room-images";

export default function Rooms() {
  const { data: rooms, isLoading } = useListRooms();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Our Accommodations</h1>
            <p className="text-muted-foreground text-lg">
              Discover our thoughtfully designed rooms and suites, each offering a perfect blend of comfort and luxury.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-12">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-muted rounded-3xl h-[400px] w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-12">
              {rooms?.map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden border-none shadow-lg bg-card/50 backdrop-blur">
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-2/5 h-[300px] md:h-auto">
                        <img 
                          src={getRoomImage(room.type)} 
                          alt={room.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <CardContent className="w-full md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="text-xs uppercase tracking-wider text-secondary font-bold mb-2">
                              {room.type}
                            </div>
                            <h2 className="text-3xl font-serif font-bold text-foreground mb-2">
                              {room.name}
                            </h2>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center text-2xl font-bold text-foreground">
                              <IndianRupee className="h-5 w-5" />
                              {room.pricePerNight}
                            </div>
                            <div className="text-sm text-muted-foreground">per night</div>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-6 line-clamp-3">
                          {room.description}
                        </p>

                        <div className="flex items-center gap-2 mb-8 text-sm font-medium text-foreground">
                          <Users className="h-4 w-4 text-primary" />
                          Up to {room.maxGuests} guests
                        </div>

                        <div className="grid grid-cols-2 gap-y-3 mb-8">
                          {room.amenities.slice(0, 4).map((amenity, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                              {amenity}
                            </div>
                          ))}
                        </div>

                        <div className="mt-auto pt-6 border-t flex justify-end">
                          <Link href={`/booking?room=${room.id}`}>
                            <Button size="lg" className="px-8" data-testid={`button-book-room-${room.id}`}>
                              Book Now
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <ChatWidget />
      <Footer />
    </div>
  );
}
