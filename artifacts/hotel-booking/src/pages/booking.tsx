import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ChatWidget } from "@/components/chatbot/chat-widget";
import { getRoomImage } from "@/lib/room-images";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useListRooms, useCreateBooking } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { IndianRupee } from "lucide-react";
import { useEffect } from "react";

const bookingSchema = z.object({
  guestName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Valid email required"),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
  numberOfGuests: z.coerce.number().min(1).max(10),
  roomId: z.coerce.number().min(1, "Please select a room"),
  specialRequests: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function Booking() {
  const [, setLocation] = useLocation();
  const { data: rooms } = useListRooms();
  const createBooking = useCreateBooking();
  const { toast } = useToast();

  // Extract roomId from URL query params if present
  const searchParams = new URLSearchParams(window.location.search);
  const initialRoomId = searchParams.get("room") ? Number(searchParams.get("room")) : undefined;

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guestName: "",
      phone: "",
      email: "",
      checkInDate: "",
      checkOutDate: "",
      numberOfGuests: 1,
      roomId: initialRoomId || 0,
      specialRequests: "",
    },
  });

  const selectedRoomId = form.watch("roomId");
  const selectedRoom = rooms?.find((r) => r.id === selectedRoomId);

  // Set default check-in/out dates to today/tomorrow if empty
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (!form.getValues("checkInDate")) {
      form.setValue("checkInDate", today.toISOString().split('T')[0]);
    }
    if (!form.getValues("checkOutDate")) {
      form.setValue("checkOutDate", tomorrow.toISOString().split('T')[0]);
    }
  }, [form]);

  const onSubmit = (data: BookingFormValues) => {
    if (!selectedRoom) return;

    createBooking.mutate(
      {
        data: {
          ...data,
          roomType: selectedRoom.type,
        },
      },
      {
        onSuccess: (response) => {
          toast({
            title: "Booking Confirmed!",
            description: "Your reservation has been successfully created.",
          });
          setLocation(`/booking/${response.id}`);
        },
        onError: () => {
          toast({
            title: "Booking Failed",
            description: "There was an error creating your booking. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-serif font-bold mb-4">Complete Your Reservation</h1>
            <p className="text-muted-foreground">Fill in your details below to confirm your stay at Grand Vista.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Guest Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="guestName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} data-testid="input-guest-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="+91 9876543210" {...field} data-testid="input-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="numberOfGuests"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Guests</FormLabel>
                              <FormControl>
                                <Input type="number" min={1} max={10} {...field} data-testid="input-guests" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="checkInDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Check-in Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-checkin" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="checkOutDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Check-out Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-checkout" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="roomId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Room</FormLabel>
                            <Select 
                              onValueChange={(val) => field.onChange(Number(val))} 
                              defaultValue={field.value ? String(field.value) : undefined}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-room">
                                  <SelectValue placeholder="Choose a room type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {rooms?.map((room) => (
                                  <SelectItem key={room.id} value={String(room.id)}>
                                    {room.name} - ₹{room.pricePerNight}/night
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="specialRequests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Special Requests (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Any special requirements..." 
                                className="resize-none" 
                                {...field} 
                                data-testid="input-requests"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full"
                        disabled={createBooking.isPending}
                        data-testid="button-submit-booking"
                      >
                        {createBooking.isPending ? "Processing..." : "Confirm Booking"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24 bg-muted/30">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedRoom ? (
                    <>
                      <div className="aspect-video w-full rounded-lg overflow-hidden mb-4">
                        <img 
                          src={getRoomImage(selectedRoom.type)}
                          alt={selectedRoom.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{selectedRoom.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedRoom.type}</p>
                      </div>
                      
                      <div className="border-t pt-4 mt-4">
                        <div className="flex justify-between mb-2 text-sm">
                          <span className="text-muted-foreground">Price per night</span>
                          <span className="font-medium flex items-center">
                            <IndianRupee className="h-3 w-3" /> {selectedRoom.pricePerNight}
                          </span>
                        </div>
                        {/* Note: In a real app, calculate actual nights based on dates. Here we just show per night */}
                        <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t">
                          <span>Total</span>
                          <span className="flex items-center text-primary">
                            <IndianRupee className="h-4 w-4" /> {selectedRoom.pricePerNight} / night
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Please select a room to view summary
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <ChatWidget />
      <Footer />
    </div>
  );
}
