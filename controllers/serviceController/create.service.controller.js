import CustomError from "../../utils/CustomError.js";
import z from "zod";
import { PrismaClient } from "../../prisma/generated/mongo/index.js";
import { serviceCreateSchema } from "../../validation schema/service.schema.js";

const prisma = new PrismaClient();

// Define Zod validation schema for service creation


const createService = async (req, res, next) => {
  try {
 
    const validatedData = serviceCreateSchema.parse(req.body);

    // Extract vendor information from authenticated user
    const vendorEmail = req.user.email;

    // Fetch vendor details based on email
    const vendor = await prisma.vendor.findUnique({
      where: { email: vendorEmail },
    });

    if (!vendor) {
      return next(new CustomError("Vendor not found.", 404));
    }

    const {rating,...inputData} = validatedData;

    // Create the new service
    const newService = await prisma.Service.create({
      data: {
        ...inputData,
        vendorId: vendor.id,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        }    
      },
    });

    // Prepare response
    const { created_at, updated_at, ...serviceResponse } = newService;

    res.status(201).json({
      success: true,
      message: "Service created successfully.",
      service: serviceResponse,
    });
  } catch (error) {
    console.error(
      `Error Type: ${error.constructor.name}, Message: ${error.message}, Stack: ${error.stack}`
    );

    next(error);
  }
};

export default createService;
