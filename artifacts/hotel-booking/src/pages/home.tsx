import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ChatWidget } from "@/components/chatbot/chat-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetHotelInfo, useGetBookingStats } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Star, MapPin, Clock, ShieldCheck, Wifi, Coffee, Car } from "lucide-react";
import { roomSuite } from "@/lib/room-images";

export default function Home() {
  const { data: hotelInfo } = useGetHotelInfo();
  const { data: stats } = useGetBookingStats();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src={roomSuite}
              alt="Grand Vista Lobby" 
              className="w-full h-full object-cover brightness-50"
            />
          </div>
          
          <div className="container relative z-10 mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 tracking-tight">
                Experience Timeless <span className="text-secondary">Elegance</span>
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 font-light">
                {hotelInfo?.name || "Grand Vista Hotel"} offers an unparalleled luxury experience in the heart of Hyderabad. Where tradition meets modern comfort.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/rooms">
                  <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 font-semibold">
                    View Our Rooms
                  </Button>
                </Link>
                <Link href="/booking">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg h-14 px-8 font-semibold">
                    Book Your Stay
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-card/50 backdrop-blur border-none shadow-sm">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-serif font-bold mb-3">Prime Location</h3>
                  <p className="text-muted-foreground">{hotelInfo?.location || "Central Hyderabad"}</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-none shadow-sm">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-serif font-bold mb-3">Flexible Timings</h3>
                  <p className="text-muted-foreground">
                    Check-in: {hotelInfo?.checkInTime || "2:00 PM"}<br/>
                    Check-out: {hotelInfo?.checkOutTime || "12:00 PM"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-none shadow-sm">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-serif font-bold mb-3">Trusted Choice</h3>
                  <p className="text-muted-foreground">
                    Over {stats?.totalBookings || "10,000"}+ guests have chosen to stay with us.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Amenities */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6 text-foreground">World-Class Amenities</h2>
              <p className="text-muted-foreground text-lg">
                Every detail at Grand Vista is designed to provide you with the utmost comfort and convenience.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Wifi, label: "High-Speed Wi-Fi" },
                { icon: Coffee, label: "Premium Dining" },
                { icon: Car, label: "Valet Parking" },
                { icon: Star, label: "5-Star Service" },
              ].map((amenity, i) => (
                <div key={i} className="flex flex-col items-center p-6 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <amenity.icon className="h-10 w-10 text-secondary mb-4" />
                  <span className="font-medium text-foreground">{amenity.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <ChatWidget />
      <Footer />
    </div>
  );
}
