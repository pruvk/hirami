import type { JSX } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BACKEND_URL, type ApiResponse } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { SelectedEquipment } from "..";
import { useAuth } from "@/auth";
import { cn } from "@/lib/utils";
import { Caption } from "@/components/typography";
import { NumberInput } from "@/components/number-input";
import { Separator } from "@/components/ui/separator";
import type { Equipment } from "@/lib/equipment";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

const borrowEquipmentItemSchema = z.object({
	equipmentTypeId: z.string().nonempty(),
	quantity: z.number().positive(),
});

const formSchema = z.object({
	equipments: z.array(borrowEquipmentItemSchema),
	location: z.string().nonempty({ message: "Please enter the location." }),
	purpose: z.string().nonempty({ message: "Please enter your purpose." }),
	expectedReturnAt: z.date(),
	requestedBy: z.string().nonempty(),
});

async function borrow(value: z.infer<typeof formSchema>): Promise<ApiResponse> {
	const response = await fetch(`${BACKEND_URL}/borrow-requests`, {
		method: "POST",
		body: JSON.stringify(value),
		headers: {
			"Content-Type": "application/json",
		},
	});

	const result: ApiResponse = await response.json();
	if (!response.ok) {
		throw new Error(result.message);
	}

	return result;
}

type BorrowEquipmentFormProps = {
	selectedEquipments: SelectedEquipment[];
	className: string;
	handleUpdateQuantity: (equipment: Equipment, newQuantity: number) => void;
	onSuccess: () => void;
};

export function BorrowEquipmentForm(
	props: BorrowEquipmentFormProps,
): JSX.Element {
	const auth = useAuth();
	const [openCalendar, setOpenCalendar] = useState(false);
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			equipments: [],
			expectedReturnAt: tomorrow,
			location: "",
			purpose: "",
			requestedBy: auth.user?.id,
		},
	});

	const mutation = useMutation({
		mutationFn: borrow,
		onMutate: () => {
			return toast.loading("Submitting borrow request");
		},
		onSuccess: (data, _variables, toastId) => {
			props.onSuccess();
			toast.success(data.message, { id: toastId });
		},
		onError: (error, _variables, toastId) => {
			toast.error(error.message, { id: toastId });
		},
	});

	async function onSubmit(value: z.infer<typeof formSchema>): Promise<void> {
		const equipmentsPayload = props.selectedEquipments.map((item) => ({
			equipmentTypeId: item.equipment.id,
			quantity: item.quantity,
		}));

		value.equipments = equipmentsPayload;
		mutation.mutate(value);
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className={cn("space-y-4", props.className)}
			>
				<section className="space-y-2">
					{props.selectedEquipments.map((selectedEquipment) => {
						const equipment = selectedEquipment.equipment;
						const equipmentImage = equipment.imageUrl
							? `${BACKEND_URL}${equipment.imageUrl}`
							: "https://arthurmillerfoundation.org/wp-content/uploads/2018/06/default-placeholder.png";

						return (
							<div
								key={equipment.id}
								className="flex items-center gap-2 justify-between"
							>
								<div className="flex items-center gap-2 w-full">
									<img
										src={equipmentImage}
										alt={`${equipment.name} ${equipment.brand}`}
										className="size-20 object-cover"
									/>

									<div className="flex flex-col">
										<p className="font-montserrat-semibold text-base leading-6">
											{equipment.name}
										</p>

										<Caption>
											{equipment.brand}
											{equipment.model ? " - " : null}
											{equipment.model}
										</Caption>
									</div>
								</div>

								<NumberInput
									onChange={(v) => props.handleUpdateQuantity(equipment, v)}
									maxValue={equipment.quantity}
								/>
							</div>
						);
					})}
				</section>

				<Separator />

				<FormField
					control={form.control}
					name="location"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Location</FormLabel>
							<FormControl>
								<Input placeholder="ex. Volleyball Court" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="purpose"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Purpose</FormLabel>
							<FormControl>
								<Input placeholder="ex. PE Class" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="expectedReturnAt"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Expected Return Date & Time</FormLabel>
							<div className="flex gap-2">
								<Popover open={openCalendar} onOpenChange={setOpenCalendar}>
									<PopoverTrigger asChild>
										<Button
											type="button"
											variant="outline"
											className="flex-1 justify-between font-normal bg-card font-open-sans text-base"
										>
											{field.value
												? field.value.toLocaleDateString()
												: "Select date"}
											<ChevronDownIcon className="h-4 w-4" />
										</Button>
									</PopoverTrigger>
									<PopoverContent
										className="w-auto overflow-hidden p-0"
										align="start"
									>
										<Calendar
											mode="single"
											selected={field.value}
											captionLayout="dropdown"
											onSelect={(date) => {
												if (date) {
													const current = field.value;
													date.setHours(
														current.getHours(),
														current.getMinutes(),
													);
													field.onChange(date);
													setOpenCalendar(false);
												}
											}}
											disabled={(date) =>
												date < new Date(new Date().setHours(0, 0, 0, 0))
											}
										/>
									</PopoverContent>
								</Popover>

								<Input
									type="time"
									step="60"
									value={field.value.toLocaleTimeString("en-GB", {
										hour: "2-digit",
										minute: "2-digit",
										hour12: false,
									})}
									onChange={(e) => {
										const [hours, minutes] = e.target.value.split(":");
										const newDate = new Date(field.value);
										newDate.setHours(
											parseInt(hours, 10),
											parseInt(minutes, 10),
										);
										field.onChange(newDate);
									}}
									className="flex-1"
								/>
							</div>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" className="w-full">
					Borrow Equipments
				</Button>
			</form>
		</Form>
	);
}
